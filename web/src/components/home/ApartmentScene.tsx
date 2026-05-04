'use client';

/*
  ApartmentScene — three.js + react-three-fiber canvas that loads
  modern_apartment.glb and runs a scroll-driven camera + furniture
  animation, ALWAYS from inside the home.

  Hassan called out that the previous orbit-then-dolly camera spent
  most of its time outside the house, making the furniture-drop
  animation invisible. This rewrite keeps the camera fixed at an
  interior eye-level position and rotates the lookAt direction so
  the user sees the apartment from inside, panning around 1.25
  revolutions over the section's scroll. Items drop from above into
  their resting positions across the same scroll range, in volume-
  descending order.

  DRACO is enabled in useGLTF(url, true) — gltf-transform output is
  typically draco-compressed and the decoder is required for the
  scene to actually load.

  Camera autofits to model bbox so the same code works regardless
  of how the .glb was exported.

  Background: solid black per Hassan's earlier brief override.
*/

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const APARTMENT_URL = '/Animations/Sketchfab/modern_apartment.glb';

function vercelEase(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

const PAN_TURNS = 1.25; // 1.25 full revolutions over scroll 0..1
const INTERIOR_FLOOR_OFFSET_MULT = 0.15; // camera below scene center
const INTERIOR_LOOK_DOWN_MULT = 0.05; // slight downward gaze
const DROP_HEIGHT = 0.6; // world units items drop from
const DROP_REVEAL_END = 0.85; // last item finishes by this scroll progress

interface DropMeshState {
  mesh: THREE.Mesh;
  origY: number;
  index: number;
}

interface ApartmentMeshesProps {
  scrollRef: React.MutableRefObject<number>;
  onLoaded?: () => void;
}

function ApartmentMeshes({ scrollRef, onLoaded }: ApartmentMeshesProps) {
  /* DRACO enabled. Without it the .glb loads as empty meshes. */
  const { scene } = useGLTF(APARTMENT_URL, true);
  const { camera } = useThree();

  const { dropMeshes, sceneCenter, sceneSize, maxDim } = React.useMemo(() => {
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
      mesh.visible = true;
    });

    const sceneBox = new THREE.Box3().setFromObject(scene);
    const center = sceneBox.getCenter(new THREE.Vector3());
    const size = sceneBox.getSize(new THREE.Vector3());

    /* Sort descending by volume. Top 30% are architecture (walls,
       floor, ceiling, big structural pieces) — always at origY,
       no drop animation. The remaining 70% drop in over scroll
       progress. */
    all.sort((a, b) => b.volume - a.volume);
    const archCount = Math.max(3, Math.floor(all.length * 0.3));
    const arch = all.slice(0, archCount);
    const dropping = all.slice(archCount);

    /* Initial state for dropping meshes: lifted by DROP_HEIGHT.
       They settle to origY as scroll progresses. Architecture stays
       at origY throughout. */
    arch.forEach(({ mesh, origY }) => {
      mesh.position.y = origY;
    });
    dropping.forEach(({ mesh, origY }) => {
      mesh.position.y = origY + DROP_HEIGHT;
    });

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[ApartmentScene] Mesh inventory:', {
        total: all.length,
        archCount,
        droppingCount: dropping.length,
        sceneBox: {
          center: [center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2)],
          size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
        },
        arch: arch.slice(0, 10).map((s) => ({ name: s.name, vol: s.volume.toFixed(3) })),
        dropping: dropping.slice(0, 15).map((s) => ({ name: s.name, vol: s.volume.toFixed(3) })),
      });
    }

    return {
      dropMeshes: dropping.map<DropMeshState>((s, i) => ({
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

  /* Cached interior position vector. Camera always sits here. */
  const interiorPos = React.useMemo(() => new THREE.Vector3(), []);
  const lookTarget = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const t = scrollRef.current;

    /* Interior camera position: at scene center horizontally,
       slightly below the geometric center vertically (closer to
       floor / human eye height inside a tall room). */
    interiorPos.set(
      sceneCenter.x,
      sceneCenter.y - sceneSize.y * INTERIOR_FLOOR_OFFSET_MULT,
      sceneCenter.z,
    );

    /* LookAt direction rotates around the camera over scroll. The
       lookTarget is one unit away from the camera in the chosen
       direction; lookAt() only cares about the direction, not the
       distance. Y offset gives a slight downward gaze so the floor
       and lower furniture are visible. */
    const angle = t * Math.PI * 2 * PAN_TURNS;
    lookTarget.set(
      interiorPos.x + Math.cos(angle),
      interiorPos.y - sceneSize.y * INTERIOR_LOOK_DOWN_MULT,
      interiorPos.z + Math.sin(angle),
    );

    camera.position.copy(interiorPos);
    camera.lookAt(lookTarget);

    /* Items drop in waves. Each item has a threshold = its index
       fraction times DROP_REVEAL_END. Earlier indexes (larger
       volume) drop first; later indexes (smaller decor) drop last.
       The reveal band per item is wide enough that drops overlap
       across multiple items at any moment, so the room "fills" in
       a continuous wave rather than a staccato file. */
    const N = dropMeshes.length;
    if (N === 0) return;
    const REVEAL_BAND = 0.35;

    for (const state of dropMeshes) {
      const threshold = (state.index / N) * DROP_REVEAL_END;
      const local = (t - threshold) / REVEAL_BAND;
      const eased = vercelEase(Math.max(0, Math.min(1, local)));
      state.mesh.position.y = state.origY + (1 - eased) * DROP_HEIGHT;
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
      /* Wider fov for the interior view so we see more of the room
         around us as the camera pans. */
      camera={{ position: [0, 0, 0], fov: 65, near: 0.1, far: 200 }}
    >
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.6} color="#FFE4B5" />
      <hemisphereLight
        intensity={0.55}
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
