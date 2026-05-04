'use client';

/*
  HeroPortrait — signature 3D element for the home page hero.

  A side-profile silhouette of a human head and shoulders, extruded
  from a procedural 2D silhouette and rendered with a custom GLSL
  shader that flows the brand gradient (cream → bronze → espresso)
  through the form. A fresnel rim brightens the bevel so the
  silhouette reads sculptural rather than flat.

  Why procedural (not a downloaded .glb): no license worry, no binary
  asset to ship and cache, full shader control, and the silhouette
  can be hand-tuned to feel intentional rather than scanned-from-a-
  real-person. The .glb path was considered and rejected.

  Motion (only when prefers-reduced-motion is unset):
  - Subtle breathing translate-Y, ±0.025u, period ~12s
  - Very slow rotation about Y, ±~1.4°, period ~28s
  - Camera dolly from shoulders-up to chin-up framing, period ~35s
  - Gradient flow across the form, period ~31s

  Performance:
  - ~5k-triangle mesh (low-poly bevelled extrusion)
  - Single ShaderMaterial, no scene lighting cost
  - Capped DPR at 1.5
  - Pauses per-frame work when document.hidden (Page Visibility API)
  - Reduced-motion: frameloop='demand', single static render

  Accessibility:
  - role="img" + aria-label on the wrapper div
  - prefers-reduced-motion: static silhouette with the gradient still
    visible (no breathing, rotation, or dolly)
*/

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

// ----- silhouette ------------------------------------------------

/* Side-profile silhouette of a head and shoulders as 2D control
   points for a closed Catmull-Rom spline. Coordinates tuned by hand
   for premium proportions. The head faces +X, so a camera at +Z sees
   a side profile facing right. */
const SILHOUETTE_CONTROL_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 1.05], // crown top
  [0.4, 0.96], // forehead crest
  [0.55, 0.78], // forehead lower
  [0.55, 0.55], // brow ridge
  [0.65, 0.48], // nose bridge
  [0.85, 0.32], // nose tip
  [0.65, 0.25], // nose underside
  [0.6, 0.16], // upper lip
  [0.58, 0.07], // mouth gap
  [0.6, -0.04], // lower lip
  [0.55, -0.18], // chin tip
  [0.4, -0.27], // jaw
  [0.18, -0.36], // jaw to neck
  [0.16, -0.55], // neck front
  [0.26, -0.7], // neck-shoulder transition front
  [0.62, -0.85], // shoulder right peak
  [1.05, -0.95], // shoulder slope
  [1.5, -1.05], // shoulder edge right
  [1.5, -1.4], // bottom-right framing edge
  [-1.2, -1.4], // bottom-left framing edge
  [-1.2, -1.05], // shoulder edge left
  [-0.8, -0.95], // shoulder slope left
  [-0.5, -0.85], // shoulder left peak
  [-0.3, -0.7], // neck-shoulder transition back
  [-0.25, -0.5], // neck back
  [-0.3, -0.3], // back of neck transition
  [-0.45, -0.1], // back of head lower
  [-0.55, 0.18], // back of head mid
  [-0.55, 0.5], // back of head upper
  [-0.45, 0.85], // back of head crown approach
  [-0.2, 1.0], // crown back
];

function buildHeadGeometry(): THREE.BufferGeometry {
  const points = SILHOUETTE_CONTROL_POINTS.map(
    ([x, y]) => new THREE.Vector2(x, y),
  );
  /* SplineCurve is open by default; close the loop by appending the
     start point so the silhouette tracks back to the crown. */
  points.push(points[0].clone());
  const spline = new THREE.SplineCurve(points);
  const samples = spline.getPoints(160);
  const shape = new THREE.Shape(samples);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.55,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: 16,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// ----- shader ----------------------------------------------------

const VERT_SHADER = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vViewPos;
  varying vec3 vNormal;

  void main() {
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAG_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorBottom;
  uniform vec3 uColorMid;
  uniform vec3 uColorTop;

  varying vec3 vLocalPos;
  varying vec3 vViewPos;
  varying vec3 vNormal;

  void main() {
    /* Map local Y across the silhouette range to 0..1, then perturb
       with two sines (different frequencies on x and time) so the
       gradient drifts across the form without seam wrapping. */
    float yNorm = (vLocalPos.y + 1.225) / 2.45;
    float flow = sin(uTime * 0.20 + vLocalPos.x * 1.4) * 0.06
               + sin(uTime * 0.10) * 0.08;
    float t = clamp(yNorm + flow, 0.0, 1.0);

    vec3 col = t < 0.5
      ? mix(uColorBottom, uColorMid, smoothstep(0.0, 0.5, t))
      : mix(uColorMid, uColorTop, smoothstep(0.5, 1.0, t));

    /* Soft directional shading so the form reads as 3D even on the
       flat front face. The flat face's normal is +Z so directional
       falls to the constant ambient floor; the bevel picks up
       variation. */
    float light = max(dot(normalize(vNormal), normalize(vec3(0.4, 0.7, 0.6))), 0.0);
    col *= 0.78 + light * 0.22;

    /* Fresnel rim toward cream brightens the bevel and silhouette
       edge so the form glows where it meets the background. */
    vec3 viewDir = normalize(vViewPos);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 1.6);
    col = mix(col, uColorTop, fresnel * 0.4);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const COLOR_BOTTOM = new THREE.Color(0x3d2817); // espresso
const COLOR_MID = new THREE.Color(0x8b6f47); // bronze
const COLOR_TOP = new THREE.Color(0xf5edDF); // cream

// ----- mesh ------------------------------------------------------

interface PortraitMeshProps {
  reduced: boolean;
}

function PortraitMesh({ reduced }: PortraitMeshProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const geometry = React.useMemo(() => buildHeadGeometry(), []);
  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT_SHADER,
        fragmentShader: FRAG_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uColorBottom: { value: COLOR_BOTTOM },
          uColorMid: { value: COLOR_MID },
          uColorTop: { value: COLOR_TOP },
        },
      }),
    [],
  );

  /* Dispose GPU resources when the component unmounts. */
  React.useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const { camera } = useThree();

  /* Set neutral framing on first paint. Used for both reduced-motion
     (static) and as the start position before the live cycle takes
     over. */
  React.useEffect(() => {
    camera.position.set(0, 0.18, 3.05);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    material.uniforms.uTime.value += delta;
    if (reduced) return;
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    /* Breathing translate-Y, ±0.025u, period ~12s. */
    meshRef.current.position.y = Math.sin(t * 0.52) * 0.025;
    /* Slow rotation about Y, ±~1.4°, period ~28s. */
    meshRef.current.rotation.y = Math.sin(t * 0.22) * 0.025;
    /* Framing morph: shoulders-up to chin-up, period ~35s. Camera
       Z dollies in while Y rises so the chin-up framing centers on
       the face instead of the shoulders. */
    const morph = (Math.sin(t * 0.18) + 1) * 0.5;
    camera.position.z = 3.45 - morph * 1.05;
    camera.position.y = morph * 0.55;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// ----- canvas wrapper --------------------------------------------

export function HeroPortrait() {
  const reduced = useReducedMotion();
  const [hidden, setHidden] = React.useState(false);

  /* Pause the canvas frameloop when the tab is hidden. Saves
     battery on mobile and avoids per-frame work when the user is
     not looking. */
  React.useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () =>
      document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const frameloop: 'always' | 'demand' | 'never' = reduced
    ? 'demand'
    : hidden
      ? 'never'
      : 'always';

  return (
    <div
      className={cn('relative h-full w-full select-none')}
      role="img"
      aria-label="Animated portrait illustration in cream, bronze, and espresso tones"
    >
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 0.18, 3.05], fov: 50, near: 0.1, far: 50 }}
        style={{ background: 'transparent' }}
      >
        <PortraitMesh reduced={reduced} />
      </Canvas>
    </div>
  );
}
