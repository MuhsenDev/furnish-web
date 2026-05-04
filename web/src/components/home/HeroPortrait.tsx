'use client';

/*
  HeroPortrait — feminine side-profile silhouette rendered with custom
  shaders and six layered motion effects. Lives inside its own
  dedicated PortraitSection on the home page (espresso background, no
  competition with the hero text).

  Why procedural (not a downloaded .glb): no license worry, no binary
  asset, full shader control, hand-tuned for premium proportions
  rather than scanned from a real person. The silhouette has a softer
  jaw, refined nose, longer neck, narrower shoulders, and medium-
  length hair that drapes down past the back shoulder line, all
  expressed as a closed Catmull-Rom spline through ~31 control points.

  Six effects layered on the form (all skipped when prefers-reduced-
  motion is on; the gradient itself still shows so the silhouette
  stays visible):

    1. Breathing translate-Y (group), period ~6s, Vercel curve halves
    2. Hair vertex displacement: vertex shader noise displaces the
       lower portion of the silhouette on the X axis, mimicking
       unseen wind through medium-length hair
    3. Scroll-driven gradient color shift: a uScrollProgress uniform
       updated from window.scrollY shifts the gradient stops so the
       portrait appears to deepen in tone as the user scrolls down
    4. Cursor gaze tilt: damped lerp toward cursor direction; max 3°
       on Y axis, 1.5° on X. Disabled on touch devices via the
       (hover: hover) media query. Distance-based fade past 800px
    5. Echo silhouettes: 3 ghost copies behind the primary mesh at
       falloff opacities (0.4, 0.2, 0.1) and slightly smaller scales,
       each X-drifting with a phase-shifted Vercel-curve oscillator
       for an "out-of-focus memory" feel
    6. Aura plane behind the silhouette: radial-gradient shader,
       opacity pulses 0.3..0.5 over ~7s, intentionally out of phase
       with the breathing cycle by 1.5s for a layered organic feel

  All loop animations use the Vercel curve pattern: ease-in-expo on
  the way up, ease-out-expo on the way down. Slow-then-fast-then-
  slow. The difference between "smooth" and "expensive."

  Performance:
  - ~5k-tri primary mesh, shared geometry across 4 instances
  - Shared uniform refs across 4 silhouette materials (one update
    per frame propagates to all 4)
  - Capped DPR at 1.5
  - Frameloop pauses when document.hidden
  - Reduced motion: frameloop='demand', single static render
*/

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

// ----- silhouette ------------------------------------------------

/* Feminine side-profile silhouette as 2D control points for a
   closed Catmull-Rom spline. The head faces +X so a camera at +Z
   sees a profile facing right. Hair flows down the back side
   (negative X) past the shoulder line, ending at the bottom-left
   framing edge. Front shoulder is narrower than the original draft. */
const SILHOUETTE_CONTROL_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 1.1], //   crown top
  [0.32, 1.05], // forehead crest
  [0.48, 0.9], //  forehead lower
  [0.5, 0.65], //  brow ridge (subtle indent)
  [0.58, 0.5], //  nose bridge
  [0.78, 0.32], // nose tip (refined, less protruded than v1)
  [0.62, 0.22], // nose underside
  [0.58, 0.13], // upper lip
  [0.55, 0.04], // mouth gap
  [0.56, -0.05], // lower lip
  [0.5, -0.18], // chin tip (gentler than v1)
  [0.35, -0.28], // softer jaw line
  [0.18, -0.4], //  jaw to neck transition
  [0.13, -0.62], // neck front (longer, narrower)
  [0.2, -0.8], //  neck to shoulder
  [0.5, -0.92], // front shoulder peak (narrower than v1)
  [0.95, -1.0], // shoulder slope
  [1.35, -1.1], // shoulder edge right
  [1.35, -1.45], // bottom-right framing edge
  [-1.5, -1.45], // bottom-left framing edge
  [-1.5, -1.2], //  hair tip lower
  [-1.25, -1.05], // hair flowing back
  [-0.95, -0.95], // hair past shoulder
  [-0.75, -0.7], //  hair upper back
  [-0.7, -0.4], //   hair behind ear
  [-0.7, -0.1], //   hair on back of head
  [-0.65, 0.2], //   back of head mid
  [-0.6, 0.5], //    back of head upper
  [-0.5, 0.8], //    back of head crown approach
  [-0.25, 1.05], //  crown back
];

function buildHeadGeometry(): THREE.BufferGeometry {
  const points = SILHOUETTE_CONTROL_POINTS.map(
    ([x, y]) => new THREE.Vector2(x, y),
  );
  /* Append start point so the open SplineCurve closes back to the
     crown without a visible seam. */
  points.push(points[0].clone());
  const spline = new THREE.SplineCurve(points);
  const samples = spline.getPoints(180);
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

// ----- shaders ---------------------------------------------------

/* Vertex shader applies hair-zone wind displacement and passes the
   displaced local position to the fragment shader so the gradient
   moves with the hair. Hair mask is 0 above the jaw and smoothstep
   to 1 in the lower portion. */
const VERT_SHADER = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vViewPos;
  varying vec3 vNormal;
  uniform float uTime;

  float hairWind(vec3 pos, float time) {
    float w1 = sin(time * 0.7 + pos.y * 4.0 + pos.x * 2.0);
    float w2 = sin(time * 1.2 + pos.y * 6.0 - pos.x * 1.5);
    float w3 = sin(time * 0.4);
    return w1 * 0.5 + w2 * 0.3 + w3 * 0.4;
  }

  void main() {
    /* After geo.center(), jaw sits around y = -0.1 and hair extends
       to y = -1.275. smoothstep ramps the displacement from above
       jaw down through the hair zone. */
    float hairMask = smoothstep(-0.1, -0.7, position.y);
    vec3 displacedPos = position;
    displacedPos.x += hairMask * hairWind(position, uTime) * 0.025;

    vLocalPos = displacedPos;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
    vViewPos = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAG_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uOpacity;
  uniform vec3 uColorBottom;
  uniform vec3 uColorMid;
  uniform vec3 uColorTop;

  varying vec3 vLocalPos;
  varying vec3 vViewPos;
  varying vec3 vNormal;

  void main() {
    /* Scroll-driven color shift. As the user scrolls deeper into the
       page the top stop pulls toward the mid (so cream becomes
       bronze-tinged) and the mid stop pulls toward the bottom (so
       bronze becomes espresso-tinged). The effect is subtle. */
    vec3 topShifted = mix(uColorTop, uColorMid, uScrollProgress * 0.65);
    vec3 midShifted = mix(uColorMid, uColorBottom, uScrollProgress * 0.50);

    /* Gradient flowing across the form, anchored to the local Y
       (centered geometry y range is roughly -1.275 to 1.275). Two
       sines on time and x add organic drift without seams. */
    float yNorm = (vLocalPos.y + 1.275) / 2.55;
    float flow = sin(uTime * 0.20 + vLocalPos.x * 1.4) * 0.06
               + sin(uTime * 0.10) * 0.07;
    float t = clamp(yNorm + flow, 0.0, 1.0);

    vec3 col = t < 0.5
      ? mix(uColorBottom, midShifted, smoothstep(0.0, 0.5, t))
      : mix(midShifted, topShifted, smoothstep(0.5, 1.0, t));

    /* Soft directional shading for depth. Front face's normal is
       +Z so directional collapses to ambient floor; the bevel
       picks up the modulation. */
    vec3 normal = normalize(vNormal);
    float light = max(dot(normal, normalize(vec3(0.4, 0.7, 0.6))), 0.0);
    col *= 0.78 + light * 0.22;

    /* Fresnel rim toward the top stop brightens the silhouette edge
       so the form glows where it meets the dark espresso background. */
    vec3 viewDir = normalize(vViewPos);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 1.6);
    col = mix(col, topShifted, fresnel * 0.45);

    gl_FragColor = vec4(col, uOpacity);
  }
`;

const AURA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURA_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    /* Soft radial falloff. smoothstep gives a clean halo without a
       hard edge. Outer 0.5 of UV space is fully transparent. */
    float alpha = smoothstep(0.5, 0.05, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const COLOR_BOTTOM = new THREE.Color(0x3d2817); // espresso
const COLOR_MID = new THREE.Color(0x8b6f47); // bronze
const COLOR_TOP = new THREE.Color(0xf5eddf); // cream
const COLOR_AURA = new THREE.Color(0xa07e54); // warm bronze-cream blend

// ----- easing ----------------------------------------------------

/* Vercel curve halves: ease-in-expo into a peak, ease-out-expo back
   to baseline. Slow-then-fast-then-slow. Used for breathing,
   aura pulse, echo drift, slow rotation. */

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* Returns 0..1..0 over one period, with ease-in-expo on the way up
   and ease-out-expo on the way down. */
function breathePhase(time: number, period: number, phaseOffset = 0): number {
  const raw = (((time + phaseOffset) % period) + period) % period;
  const t = raw / period;
  if (t < 0.5) return easeInExpo(t * 2);
  return 1 - easeOutExpo((t - 0.5) * 2);
}

/* Returns a bipolar oscillation in [-1, +1] over one period, with
   Vercel-curve halves on each direction. Used for slow rotation and
   echo drift. */
function smoothOscillation(time: number, period: number): number {
  const raw = ((time % period) + period) % period;
  const t = raw / period;
  if (t < 0.25) return easeInExpo(t * 4);
  if (t < 0.5) return 1 - easeOutExpo((t - 0.25) * 4);
  if (t < 0.75) return -easeInExpo((t - 0.5) * 4);
  return -(1 - easeOutExpo((t - 0.75) * 4));
}

// ----- scene -----------------------------------------------------

interface SilhouetteUniforms {
  uTime: { value: number };
  uScrollProgress: { value: number };
  uColorBottom: { value: THREE.Color };
  uColorMid: { value: THREE.Color };
  uColorTop: { value: THREE.Color };
}

interface PortraitSceneProps {
  reduced: boolean;
  hoverable: boolean;
  scrollRef: React.MutableRefObject<number>;
  cursorRef: React.MutableRefObject<{
    x: number;
    y: number;
    intensity: number;
  }>;
}

function PortraitScene({
  reduced,
  hoverable,
  scrollRef,
  cursorRef,
}: PortraitSceneProps) {
  /* Outer group breathes (Y translation). Tilt group inside it
     handles cursor gaze + slow auto-rotation. Echoes and aura sit
     alongside the tilt group inside the breathing group. */
  const breathingGroupRef = React.useRef<THREE.Group>(null);
  const tiltGroupRef = React.useRef<THREE.Group>(null);
  const echoMeshRefs = React.useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const currentTilt = React.useRef({ x: 0, y: 0 });

  const geometry = React.useMemo(() => buildHeadGeometry(), []);

  /* Shared uniforms across the 4 silhouette materials. Updating
     uTime / uScrollProgress once per frame propagates to all four. */
  const sharedUniforms = React.useMemo<SilhouetteUniforms>(
    () => ({
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uColorBottom: { value: COLOR_BOTTOM },
      uColorMid: { value: COLOR_MID },
      uColorTop: { value: COLOR_TOP },
    }),
    [],
  );

  const materials = React.useMemo(() => {
    /* Primary at full opacity, three echoes at falloff opacities. */
    const opacities = [1.0, 0.4, 0.2, 0.1];
    return opacities.map((opacity) => {
      const isOpaque = opacity >= 1.0;
      return new THREE.ShaderMaterial({
        vertexShader: VERT_SHADER,
        fragmentShader: FRAG_SHADER,
        uniforms: {
          ...sharedUniforms,
          uOpacity: { value: opacity },
        },
        transparent: !isOpaque,
        depthWrite: isOpaque,
      });
    });
    /* sharedUniforms is a stable object reference (memoized on
       mount) so this dependency is intentional. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedUniforms]);

  const auraMaterial = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: AURA_VERT,
        fragmentShader: AURA_FRAG,
        uniforms: {
          uColor: { value: COLOR_AURA },
          uOpacity: { value: 0.4 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  /* Dispose all GPU resources on unmount. */
  React.useEffect(() => {
    return () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      auraMaterial.dispose();
    };
  }, [geometry, materials, auraMaterial]);

  /* Static camera, framed wide enough that the silhouette is never
     clipped at any motion extreme. fov 50 + Z 4.6 with the 4:5
     portrait canvas aspect gives:
       visible half-width  ≈ 1.71  (silhouette x extent ±1.5 fits)
       visible half-height ≈ 2.14  (silhouette y extent ±1.275 fits)
     Echo X-drift extends to x = -0.145 from the silhouette base;
     1.71 visible half-width covers that with ~4% margin. Breathing
     translate-Y of ±0.04 doesn't push the crown past the top edge. */
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 0, 4.6);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;

    /* Update shared time + scroll uniforms; propagates to all 4
       silhouette materials. */
    sharedUniforms.uTime.value += delta;
    sharedUniforms.uScrollProgress.value = scrollRef.current;

    if (reduced) return;
    const t = state.clock.getElapsedTime();

    /* Effect 1: breathing translate-Y on the outer group. */
    if (breathingGroupRef.current) {
      breathingGroupRef.current.position.y = breathePhase(t, 6.0) * 0.04;
    }

    /* Effect 4 + slow auto-rotation: cursor tilt + base oscillation
       on the inner tilt group. */
    if (tiltGroupRef.current) {
      const baseRotY = smoothOscillation(t, 28.0) * 0.025;

      if (hoverable) {
        const targetY = cursorRef.current.x * 0.052 * cursorRef.current.intensity; // max 3°
        const targetX = -cursorRef.current.y * 0.026 * cursorRef.current.intensity; // max 1.5°
        /* Exponential lerp toward target. Time constant 0.27s gives
           ~0.8s settling time. */
        const lerpFactor = 1 - Math.exp(-delta / 0.27);
        currentTilt.current.y +=
          (targetY - currentTilt.current.y) * lerpFactor;
        currentTilt.current.x +=
          (targetX - currentTilt.current.x) * lerpFactor;
      } else {
        /* Decay any tilt back to zero on touch devices or when
           hover is disabled mid-session. */
        currentTilt.current.y *= 0.95;
        currentTilt.current.x *= 0.95;
      }

      tiltGroupRef.current.rotation.y = baseRotY + currentTilt.current.y;
      tiltGroupRef.current.rotation.x = currentTilt.current.x;
    }

    /* Effect 5: echo X-drift, phase-shifted per echo. Each echo
       drifts ±0.025u around its base x with an 8s period. */
    echoMeshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const baseX = -(i + 1) * 0.04;
      const phaseOffset = ((i + 1) * 8.0) / 3.0; // 2π/3 per echo (in seconds)
      const drift = smoothOscillation(t + phaseOffset, 8.0) * 0.025;
      mesh.position.x = baseX + drift;
    });

    /* Effect 6: aura pulse opacity 0.3..0.5 over 7s, offset 1.5s
       from breathing so the two cycles don't sync up. */
    const auraPhase = breathePhase(t, 7.0, 1.5);
    auraMaterial.uniforms.uOpacity.value = 0.3 + auraPhase * 0.2;
  });

  return (
    <group ref={breathingGroupRef}>
      {/* Aura: softly glowing plane behind the silhouette stack. */}
      <mesh
        position={[0, 0, -0.6]}
        renderOrder={0}
        material={auraMaterial}
      >
        <planeGeometry args={[5.5, 5.5]} />
      </mesh>

      {/* Echoes: 3 ghost copies behind the primary, each at smaller
          scale and lower opacity. renderOrder ascends from echo 3
          (back) to echo 1 (front of echoes). */}
      {[0, 1, 2].map((i) => {
        const scale = 1 - (i + 1) * 0.01;
        return (
          <mesh
            key={i}
            ref={(el) => {
              echoMeshRefs.current[i] = el;
            }}
            geometry={geometry}
            material={materials[i + 1]}
            scale={scale}
            renderOrder={1 + (2 - i)}
          />
        );
      })}

      {/* Primary silhouette inside the tilt group. renderOrder above
          all echoes. */}
      <group ref={tiltGroupRef}>
        <mesh
          geometry={geometry}
          material={materials[0]}
          renderOrder={5}
        />
      </group>
    </group>
  );
}

// ----- canvas wrapper --------------------------------------------

export function HeroPortrait() {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [hidden, setHidden] = React.useState(false);
  const [hoverable, setHoverable] = React.useState(false);

  /* Refs mutated outside React render. Read by useFrame inside the
     canvas. */
  const scrollRef = React.useRef(0);
  const cursorRef = React.useRef({ x: 0, y: 0, intensity: 0 });

  /* Pause frameloop when the tab is hidden. Saves battery and CPU
     when the user isn't looking. */
  React.useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () =>
      document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* Detect hover capability. Touch devices report (hover: none); the
     gaze-tracking effect is disabled there to avoid weird tilt on
     tap-and-drag. */
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover)');
    setHoverable(mq.matches);
    const update = () => setHoverable(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  /* Track scroll progress (0..1 across the document). Updated as a
     ref so the listener doesn't re-render on every scroll tick. */
  React.useEffect(() => {
    const handler = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Cursor gaze listener (desktop only, motion-respect). Distance
     past 800px from the canvas center fades the effect to zero. */
  React.useEffect(() => {
    if (!hoverable || reduced) {
      cursorRef.current = { x: 0, y: 0, intensity: 0 };
      return;
    }
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const intensity =
        distance > 800 ? 0 : Math.max(0, 1 - distance / 800);
      cursorRef.current = {
        x: Math.max(-1, Math.min(1, dx / 600)),
        y: Math.max(-1, Math.min(1, dy / 600)),
        intensity,
      };
    };
    const leave = () => {
      cursorRef.current.intensity = 0;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', handler);
      document.removeEventListener('mouseleave', leave);
    };
  }, [hoverable, reduced]);

  const frameloop: 'always' | 'demand' | 'never' = reduced
    ? 'demand'
    : hidden
      ? 'never'
      : 'always';

  return (
    <div
      ref={wrapperRef}
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
        camera={{ position: [0, 0, 4.6], fov: 50, near: 0.1, far: 50 }}
        style={{ background: 'transparent' }}
      >
        <PortraitScene
          reduced={reduced}
          hoverable={hoverable && !reduced}
          scrollRef={scrollRef}
          cursorRef={cursorRef}
        />
      </Canvas>
    </div>
  );
}
