"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
 *
 * No drei. It was here for exactly two things — <Edges> and <Float> — and
 * <Edges> renders through three-stdlib's fat-line stack (Line2 / LineMaterial
 * / LineSegmentsGeometry), which is a lot of bundle for edges that are drawn
 * one pixel wide at this scale. Both are reproduced below in about twenty
 * lines against three itself. Measured effect on the home page: see CHANGELOG.
 */

const INK = "#aeb6c2";
const AMBER = "#f5a524";
const BODY = "#191d22";

/*
 * Geometry and materials are built once at module scope rather than per
 * render. They are immutable and shared across every instance, and this module
 * is inside the lazily-loaded chunk, so none of it runs until the canvas is
 * actually being mounted.
 */
const EDGE_THRESHOLD = 20;

function edgesOf(geometry: THREE.BufferGeometry) {
  return new THREE.EdgesGeometry(geometry, EDGE_THRESHOLD);
}

const GEO = {
  body: new THREE.BoxGeometry(3.2, 1.75, 0.5),
  pocket: new THREE.BoxGeometry(2.35, 0.85, 0.16),
  pullBar: new THREE.BoxGeometry(1.9, 0.3, 0.14),
  springTab: new THREE.BoxGeometry(0.66, 0.42, 0.28),
  boss: new THREE.CylinderGeometry(0.17, 0.17, 0.2, 24),
  centreline: new THREE.BoxGeometry(0.012, 2.6, 0.012),
};

const EDGES = {
  body: edgesOf(GEO.body),
  pocket: edgesOf(GEO.pocket),
  pullBar: edgesOf(GEO.pullBar),
  springTab: edgesOf(GEO.springTab),
  boss: edgesOf(GEO.boss),
};

const MAT = {
  body: new THREE.MeshStandardMaterial({ color: BODY, metalness: 0.35, roughness: 0.55 }),
  pullBar: new THREE.MeshStandardMaterial({ color: BODY, metalness: 0.5, roughness: 0.35 }),
  springTab: new THREE.MeshStandardMaterial({ color: BODY, metalness: 0.4, roughness: 0.5 }),
  boss: new THREE.MeshStandardMaterial({ color: BODY, metalness: 0.6, roughness: 0.3 }),
  centreline: new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.35 }),
  edgeInk: new THREE.LineBasicMaterial({ color: INK }),
  edgeAmber: new THREE.LineBasicMaterial({ color: AMBER }),
};

/** A mesh with CAD edges drawn over it. The edges are a child, so they inherit
 *  the mesh's transform and stay welded to it through the rotation sweep. */
function Part({
  geometry,
  edges,
  material,
  edgeMaterial = MAT.edgeInk,
  ...props
}: {
  geometry: THREE.BufferGeometry;
  edges: THREE.BufferGeometry;
  material: THREE.Material;
  edgeMaterial?: THREE.Material;
} & React.ComponentProps<"mesh">) {
  return (
    <mesh geometry={geometry} material={material} {...props}>
      <lineSegments geometry={edges} material={edgeMaterial} />
    </mesh>
  );
}

function Latch({ floating }: { floating: boolean }) {
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

    /* The float, folded into the transform that was already being computed
       here. Three sine terms at unrelated periods: a slow tilt on each axis
       plus the vertical bob, which is what reads as "suspended" rather than
       "rotating on a spindle". */
    const floatX = floating ? Math.sin(t * 0.73) * 0.055 : 0;
    const floatZ = floating ? Math.sin(t * 0.41) * 0.06 : 0;
    const floatY = floating ? Math.sin(t * 0.6) * 0.05 : 0;

    // Idle rotation and scroll always apply; the cursor term is scaled by how
    // engaged the box currently is, so it fades in and out with the hover.
    const targetY =
      t * 0.12 + scroll.current * Math.PI * 0.9 + pointer.current.x * 0.55 * k;
    const targetX =
      -0.35 + scroll.current * 0.5 + pointer.current.y * 0.32 * k + floatX;

    g.rotation.y += (targetY - g.rotation.y) * ease;
    g.rotation.x += (targetX - g.rotation.x) * ease;
    g.rotation.z = floatZ;
    g.position.y = floatY - scroll.current * 0.6;
    // Leans very slightly toward the viewer while engaged.
    g.scale.setScalar(1.02 + k * 0.05);
  });

  // Static composition, so the tree never re-renders once mounted — every
  // frame's work happens on the refs above rather than through React.
  const parts = useMemo(
    () => (
      <>
        {/* latch body */}
        <Part geometry={GEO.body} edges={EDGES.body} material={MAT.body} castShadow />

        {/* recessed handle pocket */}
        <Part
          geometry={GEO.pocket}
          edges={EDGES.pocket}
          material={MAT.body}
          position={[0, -0.05, 0.26]}
        />

        {/* the pull bar — the piece that snaps, so it gets the accent */}
        <Part
          geometry={GEO.pullBar}
          edges={EDGES.pullBar}
          material={MAT.pullBar}
          edgeMaterial={MAT.edgeAmber}
          position={[0, -0.05, 0.4]}
        />

        {/* spring tab, top centre */}
        <Part
          geometry={GEO.springTab}
          edges={EDGES.springTab}
          material={MAT.springTab}
          edgeMaterial={MAT.edgeAmber}
          position={[0, 1.08, 0]}
        />

        {/* screw bosses */}
        {[-1.25, 1.25].map((x) => (
          <Part
            key={x}
            geometry={GEO.boss}
            edges={EDGES.boss}
            material={MAT.boss}
            position={[x, 0.6, 0.28]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        ))}

        {/* centreline, the way a drawing would mark it */}
        <mesh geometry={GEO.centreline} material={MAT.centreline} position={[0, 0, -0.3]} />
      </>
    ),
    []
  );

  return <group ref={group}>{parts}</group>;
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
          <Latch floating={false} />
        </group>
      ) : (
        <Latch floating />
      )}
    </Canvas>
  );
}
