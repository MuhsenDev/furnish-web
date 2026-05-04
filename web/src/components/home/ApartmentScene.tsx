'use client';

/*
  ApartmentScene — three.js + react-three-fiber canvas that loads
  modern_apartment.glb and runs a two-phase scroll-driven camera
  animation:

    Phase 1 (scroll 0 .. 0.5):
      Camera orbits the fully-furnished apartment 1.25 revolutions
      ("360+"). Every mesh is visible at its original position from
      frame 1 — no categorization, no scale-zero tricks. Empty
      rooms previously appeared because the categorization heuristic
      was hiding things it shouldn't.

    Phase 2 (scroll 0.5 .. 1.0):
      Camera dollies from the orbit-end position into the middle of
      the apartment using a Vercel-curve lerp. As it arrives, the
      smaller meshes (bottom 40% by bounding-box volume) play a
      subtle bell-curve "settle" bounce on Y: lift slightly, drop
      back to original. The animation is staggered across the items
      so the room feels like it's exhaling into final position.

  DRACO is enabled in useGLTF(url, true) because gltf-transform
  output is typically draco-compressed; without the decoder the
  scene loads as empty meshes.

  Camera autofits to model bbox, so the same code works regardless
  of how the .glb was exported (units, scale, origin).

  Background: solid black per Hassan's brief override.
*/

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const APARTMENT_URL = '/Animations/Sketchfab/modern_apartment.glb';

function vercelEase(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

const ORBIT_TURNS = 1.25;
const ORBIT_DISTANCE_MULT = 0.95;
const ORBIT_HEIGHT_MULT = 0.25;
const INTERIOR_HEIGHT_MULT = 0.08;
const SETTLE_PEAK = 0.35;

interface SettleMeshState {
  mesh: THREE.Mesh;
  origY: number;
  index: number;
}

interface ApartmentMeshesProps {
  scrollRef: React.MutableRefObject<number>;
  onLoaded?: () => void;
}

function ApartmentMeshes({ scrollRef, onLoaded }: ApartmentMeshesProps) {
  /* DRACO enabled. Without `true` here, draco-compressed .glb files
     either load as empty or throw silently. */
  const { scene } = useGLTF(APARTMENT_URL, true);
  const { camera } = useThree();

  const { settleMeshes, sceneCenter, sceneSize, maxDim } = React.useMemo(() => {
    const all: {
      mesh: THREE.Mesh;
      volume: number;
      origY: number;
      name: string;
    }[] = [];

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
      }
      const bbox = mesh.geometry.boundingBox;
      if (!bbox) return;
      const size = bbox.getSize(new THREE.Vector3());
      const volume = Math.max(0.0001, size.x * size.y * size.z);
      all.push({
        mesh,
        volume,
        origY: mesh.position.y,
        name: mesh.name || '(unnamed)',
      });

      /* Make every mesh visible from the start. The previous
         "hide reveal meshes" pass was eating walls/floor on this
         model. */
      mesh.visible = true;
    });

    const sceneBox = new THREE.Box3().setFromObject(scene);
    const center = sceneBox.getCenter(new THREE.Vector3());
    const size = sceneBox.getSize(new THREE.Vector3());

    /* Sort descending by volume; smaller meshes get the settle
       animation in phase 2. Top 60% are background (no animation,
       always at origY). Bottom 40% bounce. */
    all.sort((a, b) => b.volume - a.volume);
    const settleStart = Math.floor(all.length * 0.6);
    const settleable = all.slice(settleStart);

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[ApartmentScene] Mesh inventory:', {
        total: all.length,
        settleableCount: settleable.length,
        sceneBox: {
          center: [center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2)],
          size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
        },
        background: all.slice(0, settleStart).map((s) => ({
          name: s.name,
          volume: s.volume.toFixed(3),
        })),
        settleable: settleable.map((s) => ({
          name: s.name,
          volume: s.volume.toFixed(3),
        })),
      });
    }

    return {
      settleMeshes: settleable.map<SettleMeshState>((s, i) => ({
        mesh: s.mesh,
        origY: s.origY,
        index: i,
      })),
      sceneCenter: center,
      sceneSize: size,
      maxDim: Math.max(size.x, size.y, size.z),
    };
  }, [scene]);

  React.useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.near = Math.max(0.01, maxDim * 0.005);
      persp.far = Math.max(100, maxDim * 20);
      persp.updateProjectionMatrix();
    }
  }, [camera, maxDim]);

  React.useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  const orbitEndPos = React.useMemo(() => new THREE.Vector3(), []);
  const interiorPos = React.useMemo(() => new THREE.Vector3(), []);
  const lerped = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const progress = scrollRef.current;

    const orbitDistance = maxDim * ORBIT_DISTANCE_MULT;
    const orbitHeight = maxDim * ORBIT_HEIGHT_MULT;
    const orbitTotalAngle = Math.PI * 2 * ORBIT_TURNS;

    if (progress < 0.5) {
      /* Phase 1: orbit. Apartment is fully visible, fully
         furnished. Camera circles. */
      const phase1 = progress / 0.5;
      const angle = phase1 * orbitTotalAngle;

      camera.position.set(
        sceneCenter.x + Math.cos(angle) * orbitDistance,
        sceneCenter.y + orbitHeight,
        sceneCenter.z + Math.sin(angle) * orbitDistance,
      );
      camera.lookAt(sceneCenter);

      /* Settle meshes pinned at origY during phase 1. */
      for (const state of settleMeshes) {
        state.mesh.position.y = state.origY;
      }
    } else {
      /* Phase 2: dolly camera from orbit-end into the middle. */
      const phase2 = (progress - 0.5) / 0.5;
      const eased = vercelEase(phase2);

      orbitEndPos.set(
        sceneCenter.x + Math.cos(orbitTotalAngle) * orbitDistance,
        sceneCenter.y + orbitHeight,
        sceneCenter.z + Math.sin(orbitTotalAngle) * orbitDistance,
      );
      interiorPos.set(
        sceneCenter.x,
        sceneCenter.y + maxDim * INTERIOR_HEIGHT_MULT,
        sceneCenter.z,
      );

      lerped.lerpVectors(orbitEndPos, interiorPos, eased);
      camera.position.copy(lerped);
      camera.lookAt(sceneCenter);

      /* Settle bounce: bell-curve Y-offset on smaller meshes,
         staggered. lift→drop→settle so items appear to "drop" into
         place, but the start and end positions match origY (no
         teleport). */
      const N = settleMeshes.length;
      const REVEAL_BAND = N > 0 ? 0.5 : 1;

      for (const state of settleMeshes) {
        const { mesh, origY, index } = state;
        const threshold = (index / Math.max(1, N)) * 0.6;
        const local = (phase2 - threshold) / REVEAL_BAND;
        const localClamp = Math.max(0, Math.min(1, local));
        /* sin curve from 0 → 1 → 0 over the band. */
        const yOff = Math.sin(localClamp * Math.PI) * SETTLE_PEAK;
        mesh.position.y = origY + yOff;
      }
    }
  });

  return <primitive object={scene} />;
}

interface ApartmentSceneProps {
  scrollRef: React.MutableRefObject<number>;
  inView: boolean;
  onLoaded?: () => void;
}

export function ApartmentScene({
  scrollRef,
  inView,
  onLoaded,
}: ApartmentSceneProps) {
  return (
    <Canvas
      frameloop={inView ? 'always' : 'demand'}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      }}
      camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 200 }}
    >
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.6} color="#FFE4B5" />
      <hemisphereLight
        intensity={0.5}
        color="#FFF5E1"
        groundColor="#1a1a1a"
      />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        color="#FFFAEA"
      />
      <directionalLight
        position={[-5, 8, -3]}
        intensity={0.5}
        color="#A07E54"
      />

      <React.Suspense fallback={null}>
        <ApartmentMeshes scrollRef={scrollRef} onLoaded={onLoaded} />
      </React.Suspense>
    </Canvas>
  );
}

useGLTF.preload(APARTMENT_URL, true);
