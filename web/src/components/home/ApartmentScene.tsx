'use client';

/*
  ApartmentScene — three.js + react-three-fiber canvas that loads
  modern_apartment.glb and runs a two-phase scroll-driven camera +
  furniture animation:

    Phase 1 (scroll 0 .. 0.5):
      Camera orbits the apartment 1.25 full revolutions ("360+")
      while the room stays empty. Architecture (walls / floor /
      ceiling) is visible from the start; furniture and decor are
      scaled to zero.

    Phase 2 (scroll 0.5 .. 1.0):
      Camera dollies from the orbit-end position into the middle
      of the apartment using a Vercel-curve lerp. As it moves in,
      furniture and decor drop in one by one (scale 0 → original,
      Y position drops from origY+0.6 to origY) in volume-
      descending order. By the time the section leaves the
      viewport, the camera is inside the living-room area and
      every mesh is in place.

  Camera autofits to the loaded model's bounding box so the same
  code works regardless of how the .glb was exported (units, scale,
  origin).

  Background: solid black per Hassan's call. White text on the
  surrounding section. No HDR / environment map.
*/

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const APARTMENT_URL = '/Animations/Sketchfab/modern_apartment.glb';

/* Approximates the Vercel curve cubic-bezier(0.16, 1, 0.3, 1) with
   a quintic ease-out. Visually indistinguishable from the cubic-
   bezier and trivial to evaluate per-frame. */
function vercelEase(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/* Camera-path constants, expressed as multiples of the model's
   max bounding-box dimension so the scene framing is correct
   regardless of model scale. */
const ORBIT_TURNS = 1.25; // 1.25 * 360° = 450°, "360+" per brief
const ORBIT_DISTANCE_MULT = 0.95; // distance from scene center
const ORBIT_HEIGHT_MULT = 0.25; // elevation above scene center
const INTERIOR_OFFSET_X_MULT = 0.05;
const INTERIOR_OFFSET_Y_MULT = 0.08;
const INTERIOR_OFFSET_Z_MULT = 0.05;

interface RevealMeshState {
  mesh: THREE.Mesh;
  origY: number;
  origScale: THREE.Vector3;
  index: number;
}

interface ApartmentMeshesProps {
  scrollRef: React.MutableRefObject<number>;
  onLoaded?: () => void;
}

function ApartmentMeshes({ scrollRef, onLoaded }: ApartmentMeshesProps) {
  const { scene } = useGLTF(APARTMENT_URL);
  const { camera } = useThree();

  const { revealMeshes, sceneCenter, sceneSize, maxDim } = React.useMemo(() => {
    const all: {
      mesh: THREE.Mesh;
      volume: number;
      origY: number;
      origScale: THREE.Vector3;
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
        origScale: mesh.scale.clone(),
        name: mesh.name || '(unnamed)',
      });
    });

    /* Compute scene bbox before scaling any meshes to zero. */
    const sceneBox = new THREE.Box3().setFromObject(scene);
    const center = sceneBox.getCenter(new THREE.Vector3());
    const size = sceneBox.getSize(new THREE.Vector3());

    all.sort((a, b) => b.volume - a.volume);

    /* Top 15% (clamped 3..8) treated as architecture; always
       visible. The rest reveal during phase 2. */
    const archCount = Math.min(8, Math.max(3, Math.floor(all.length * 0.15)));
    const arch = all.slice(0, archCount);
    const reveal = all.slice(archCount);

    arch.forEach(({ mesh }) => {
      mesh.visible = true;
    });
    reveal.forEach(({ mesh }) => {
      mesh.visible = false;
      mesh.scale.setScalar(0);
    });

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[ApartmentScene] Mesh categorization:', {
        total: all.length,
        archCount,
        revealCount: reveal.length,
        sceneBox: {
          center: [center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2)],
          size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
        },
        architecture: arch.map((s) => ({
          name: s.name,
          volume: s.volume.toFixed(3),
        })),
        reveal: reveal.map((s) => ({
          name: s.name,
          volume: s.volume.toFixed(3),
        })),
      });
    }

    return {
      revealMeshes: reveal.map<RevealMeshState>((s, i) => ({
        mesh: s.mesh,
        origY: s.origY,
        origScale: s.origScale,
        index: i,
      })),
      sceneCenter: center,
      sceneSize: size,
      maxDim: Math.max(size.x, size.y, size.z),
    };
  }, [scene]);

  /* Set near/far on first mount so the model isn't clipped at any
     point along the camera path. Camera position is driven by
     useFrame, not here. */
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

  /* Cached vectors so we don't allocate per frame. */
  const orbitEndPos = React.useMemo(() => new THREE.Vector3(), []);
  const interiorPos = React.useMemo(() => new THREE.Vector3(), []);
  const lerped = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const progress = scrollRef.current;

    const orbitDistance = maxDim * ORBIT_DISTANCE_MULT;
    const orbitHeight = maxDim * ORBIT_HEIGHT_MULT;
    const orbitTotalAngle = Math.PI * 2 * ORBIT_TURNS;

    if (progress < 0.5) {
      /* Phase 1: orbit. Camera circles the apartment while the
         room stays empty. */
      const phase1 = progress / 0.5;
      const angle = phase1 * orbitTotalAngle;

      camera.position.set(
        sceneCenter.x + Math.cos(angle) * orbitDistance,
        sceneCenter.y + orbitHeight,
        sceneCenter.z + Math.sin(angle) * orbitDistance,
      );
      camera.lookAt(sceneCenter);

      /* Make sure all reveal meshes stay hidden during phase 1.
         Toggling visible to false is cheaper than re-zeroing scale
         every frame. */
      for (const state of revealMeshes) {
        if (state.mesh.visible) state.mesh.visible = false;
      }
    } else {
      /* Phase 2: dolly camera from orbit-end position into the
         middle of the apartment, while furniture drops in. */
      const phase2 = (progress - 0.5) / 0.5;
      const eased = vercelEase(phase2);

      orbitEndPos.set(
        sceneCenter.x + Math.cos(orbitTotalAngle) * orbitDistance,
        sceneCenter.y + orbitHeight,
        sceneCenter.z + Math.sin(orbitTotalAngle) * orbitDistance,
      );
      interiorPos.set(
        sceneCenter.x + maxDim * INTERIOR_OFFSET_X_MULT,
        sceneCenter.y + maxDim * INTERIOR_OFFSET_Y_MULT,
        sceneCenter.z + maxDim * INTERIOR_OFFSET_Z_MULT,
      );

      lerped.lerpVectors(orbitEndPos, interiorPos, eased);
      camera.position.copy(lerped);
      camera.lookAt(sceneCenter);

      /* Furniture reveals across phase 2. Each mesh has a
         threshold = index / N; once phase2 passes the threshold,
         the mesh animates in over the next REVEAL_BAND of phase
         progress. Larger furniture (lower index) reveals first. */
      const N = revealMeshes.length;
      const REVEAL_BAND = N > 0 ? 0.5 / N : 1;

      for (const state of revealMeshes) {
        const { mesh, origY, origScale, index } = state;
        const threshold = index / Math.max(1, N);
        const local = (phase2 - threshold) / REVEAL_BAND;
        const e = vercelEase(Math.max(0, Math.min(1, local)));

        if (e > 0.001) {
          if (!mesh.visible) mesh.visible = true;
          mesh.scale.set(
            origScale.x * e,
            origScale.y * e,
            origScale.z * e,
          );
          mesh.position.y = origY + (1 - e) * 0.6;
        } else if (mesh.visible) {
          mesh.visible = false;
        }
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
      /* Initial camera; Phase-1 orbit math overrides this on the
         first frame. fov 55 widens the room when camera is inside
         during phase 2. */
      camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 200 }}
    >
      {/* Solid black background per Hassan's brief. */}
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.55} color="#FFE4B5" />
      <hemisphereLight
        intensity={0.45}
        color="#FFF5E1"
        groundColor="#1a1a1a"
      />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.4}
        color="#FFFAEA"
      />
      <directionalLight
        position={[-5, 8, -3]}
        intensity={0.45}
        color="#A07E54"
      />

      <React.Suspense fallback={null}>
        <ApartmentMeshes scrollRef={scrollRef} onLoaded={onLoaded} />
      </React.Suspense>
    </Canvas>
  );
}

useGLTF.preload(APARTMENT_URL);
