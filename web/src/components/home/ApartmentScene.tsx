'use client';

/*
  ApartmentScene — three.js + react-three-fiber canvas that loads
  modern_apartment.glb (~11 MB) and progressively reveals furniture
  as the user scrolls through the parent section.

  Lazy-loaded by ApartmentScrollSection via dynamic({ssr:false}) so
  the three.js bundle (~190 KB gz) and the .glb itself (~11 MB) stay
  off the critical path.

  Mesh categorization:
  - Walks the loaded scene tree, collects every Mesh, computes
    bounding-box volume per mesh.
  - Sorted descending by volume.
  - Top 15% (clamped 3..8) treated as architecture: walls, floor,
    ceiling, structural pieces. Always visible from frame 1.
  - The rest are revealed in volume-descending order across scroll
    progress 0..1. Larger furniture appears first; small decor last.

  Reveal animation:
  - Scale 0 → original (Vercel curve, 1 - (1-t)^5 quintic out)
  - Y position drops from origY+0.6 to origY (drops in from above)
  - mesh.visible toggles at the start/end of the reveal band so we
    don't pay for backfaced/zero-scale meshes outside their window.

  Camera autofits to the loaded model's bounding box on mount, so
  the same code works regardless of how the .glb was exported in
  Blender/Sketchfab terms (units, origin, etc.).
*/

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const APARTMENT_URL = '/Animations/Sketchfab/modern_apartment.glb';

/* Approximates the Vercel curve cubic-bezier(0.16, 1, 0.3, 1) with
   a quintic ease-out. Visually indistinguishable from the cubic-
   bezier and trivial to evaluate in a useFrame loop. */
function vercelEase(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

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

  /* Categorize once, store reveal-mesh state. */
  const { revealMeshes, sceneCenter, sceneSize } = React.useMemo(() => {
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

    /* Compute the scene's bounding box BEFORE we scale any meshes
       to zero, so the camera autofit uses the model's natural
       extent. */
    const sceneBox = new THREE.Box3().setFromObject(scene);
    const center = sceneBox.getCenter(new THREE.Vector3());
    const size = sceneBox.getSize(new THREE.Vector3());

    /* Sort descending by volume. */
    all.sort((a, b) => b.volume - a.volume);

    /* Architecture: top 15% of meshes (clamped to [3, 8]). Always
       visible. */
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
    };
  }, [scene]);

  /* Autofit camera to the model. Position is at a 30°-ish elevated
     three-quarter angle so the viewer sees a clean perspective into
     the room, not just a top-down or eye-level shot. */
  React.useEffect(() => {
    const maxDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z);
    const distance = Math.max(maxDim * 1.4, 1);
    camera.position.set(
      sceneCenter.x + distance * 0.7,
      sceneCenter.y + distance * 0.55,
      sceneCenter.z + distance * 0.7,
    );
    camera.lookAt(sceneCenter);
    /* Update near/far so the model isn't clipped. */
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.near = Math.max(0.01, maxDim * 0.01);
      persp.far = Math.max(100, maxDim * 10);
      persp.updateProjectionMatrix();
    }
  }, [camera, sceneCenter, sceneSize]);

  /* Signal load complete on first mount. By the time this component
     renders, useGLTF has resolved the suspense, so the .glb is in
     memory and meshes are categorized. */
  React.useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  useFrame(() => {
    const progress = scrollRef.current;
    const N = revealMeshes.length;
    if (N === 0) return;

    /* Each mesh's reveal threshold is its index / N (0..1).
       REVEAL_BAND controls how long the per-mesh animation takes
       (in scroll-progress units). 0.6 / N keeps reveals overlapped
       so the room fills coherently rather than as a stuttery
       single-file march. */
    const REVEAL_BAND = 0.6 / N;

    for (const state of revealMeshes) {
      const { mesh, origY, origScale, index } = state;
      const threshold = index / N;
      const local = (progress - threshold) / REVEAL_BAND;
      const eased = vercelEase(Math.max(0, Math.min(1, local)));

      if (eased > 0.001) {
        if (!mesh.visible) mesh.visible = true;
        mesh.scale.set(
          origScale.x * eased,
          origScale.y * eased,
          origScale.z * eased,
        );
        mesh.position.y = origY + (1 - eased) * 0.6;
      } else if (mesh.visible) {
        mesh.visible = false;
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
      camera={{ position: [4, 3, 4], fov: 45, near: 0.1, far: 200 }}
    >
      {/* Solid espresso background fills any gaps the model doesn't
          cover, matching the section's bg-deep. */}
      <color attach="background" args={['#3D2817']} />

      {/* Lighting: ambient floor + warm hemisphere + key from the
          "window" + cool fill from opposite. No external HDR, no
          environment-map round-trip to drei's CDN. */}
      <ambientLight intensity={0.5} color="#FFE4B5" />
      <hemisphereLight
        intensity={0.55}
        color="#FFF5E1"
        groundColor="#3D2817"
      />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.4}
        color="#FFFAEA"
      />
      <directionalLight
        position={[-5, 8, -3]}
        intensity={0.4}
        color="#A07E54"
      />

      <React.Suspense fallback={null}>
        <ApartmentMeshes scrollRef={scrollRef} onLoaded={onLoaded} />
      </React.Suspense>
    </Canvas>
  );
}

/* Preload the .glb when this module is loaded. Since the module
   itself is dynamic-imported in ApartmentScrollSection, this runs
   after the dynamic chunk arrives, which is when we WANT to start
   the model fetch. */
useGLTF.preload(APARTMENT_URL);
