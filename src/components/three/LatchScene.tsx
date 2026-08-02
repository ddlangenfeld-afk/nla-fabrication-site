"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Float } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/*
 * The hero object is the glove box latch, modelled from primitives — the same
 * part the 2D technical drawings show, in the medium the shop actually works
 * in. Deliberately not a generic particle field: the thesis of the hero is
 * "this is made by someone who does hard-surface CAD", and abstract geometry
 * would say nothing about that.
 *
 * Rendered as matte dark plastic with amber CAD edges, so it reads as a
 * working drawing rather than a product beauty shot — honest, given no real
 * part has been photographed yet.
 */

const INK = "#aeb6c2";
const AMBER = "#f5a524";
const BODY = "#191d22";

function Latch() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      // Normalised over the first viewport — the hero is all that matters.
      scroll.current = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { gl } = useThree();
  // 0 while the cursor is outside the viewport box, 1 while it's inside.
  // Eased rather than switched so the part settles back to its idle spin
  // instead of snapping when the cursor leaves.
  const engaged = useRef(0);

  useEffect(() => {
    // Bounds come from the canvas element itself, so the rotation answers to
    // the cursor's position *within the box* rather than within the window.
    // Tracking window coordinates meant the part reacted to the cursor
    // anywhere on the page, including far away from the viewport it lives in.
    const el = gl.domElement;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;

      engaged.current = inside ? 1 : 0;
      if (inside) {
        pointer.current = { x: x * 2 - 1, y: y * 2 - 1 };
      }
    };

    const onLeave = () => {
      engaged.current = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  const engagedEased = useRef(0);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const t = state.clock.elapsedTime;

    // Frame-rate independent easing; without the delta term this drifts
    // between a 60Hz and a 120Hz display.
    const ease = 1 - Math.pow(0.0015, delta);
    engagedEased.current +=
      (engaged.current - engagedEased.current) * (1 - Math.pow(0.01, delta));
    const k = engagedEased.current;

    // Idle rotation and scroll always apply; the cursor term is scaled by how
    // engaged the box currently is, so it fades in and out with the hover.
    const targetY =
      t * 0.12 + scroll.current * Math.PI * 0.9 + pointer.current.x * 0.55 * k;
    const targetX = -0.35 + scroll.current * 0.5 + pointer.current.y * 0.32 * k;

    g.rotation.y += (targetY - g.rotation.y) * ease;
    g.rotation.x += (targetX - g.rotation.x) * ease;
    g.position.y = Math.sin(t * 0.6) * 0.05 - scroll.current * 0.6;
    // Leans very slightly toward the viewer while engaged.
    g.scale.setScalar(1.02 + k * 0.05);
  });

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BODY,
        metalness: 0.35,
        roughness: 0.55,
      }),
    []
  );

  // Base scale is set per-frame in useFrame (it leans in on hover), sized to
  // stay clear of the viewport frame through the full rotation sweep.
  return (
    <group ref={group}>
      {/* latch body */}
      <mesh material={bodyMaterial} castShadow>
        <boxGeometry args={[3.2, 1.75, 0.5]} />
        <Edges threshold={20} color={INK} />
      </mesh>

      {/* recessed handle pocket */}
      <mesh position={[0, -0.05, 0.26]} material={bodyMaterial}>
        <boxGeometry args={[2.35, 0.85, 0.16]} />
        <Edges threshold={20} color={INK} />
      </mesh>

      {/* the pull bar — the piece that snaps, so it gets the accent */}
      <mesh position={[0, -0.05, 0.4]}>
        <boxGeometry args={[1.9, 0.3, 0.14]} />
        <meshStandardMaterial color={BODY} metalness={0.5} roughness={0.35} />
        <Edges threshold={20} color={AMBER} />
      </mesh>

      {/* spring tab, top centre */}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[0.66, 0.42, 0.28]} />
        <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.5} />
        <Edges threshold={20} color={AMBER} />
      </mesh>

      {/* screw bosses */}
      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.2, 24]} />
          <meshStandardMaterial color={BODY} metalness={0.6} roughness={0.3} />
          <Edges threshold={20} color={INK} />
        </mesh>
      ))}

      {/* centreline, the way a drawing would mark it */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[0.012, 2.6, 0.012]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export default function LatchScene({ reduced = false }: { reduced?: boolean }) {
  return (
    <Canvas
      // Capped DPR: past ~1.75 the extra pixels cost frames and buy nothing on
      // a matte object with hairline edges.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // A still frame when reduced motion is requested: the object is composed
      // and lit, it simply doesn't move.
      frameloop={reduced ? "demand" : "always"}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} />
      {/* Amber rim from behind — the light that makes edges read on near-black. */}
      <pointLight position={[-3, -1, -4]} intensity={55} distance={20} color={AMBER} />
      <pointLight position={[5, 2, -3]} intensity={26} distance={22} color="#7cc7ff" />

      {reduced ? (
        <group rotation={[-0.35, 0.6, 0]}>
          <Latch />
        </group>
      ) : (
        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
          <Latch />
        </Float>
      )}
    </Canvas>
  );
}
