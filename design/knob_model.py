#!/usr/bin/env python3
"""
NLA Fabrication | HVAC slider knob | 96-98 Civic EK/EJ
Parametric mesh generator. Pure Python, no dependencies.

    python3 design/knob_model.py            # writes .obj and .stl
    python3 design/knob_model.py --no-line  # blank face, for the custom designs

WHAT THIS IS
    A dimensionally-accurate solid built from the reconciled envelope on
    design/hvac-slider-knob-orthographic.svg. It is a modelling starting
    point, not a finished part: the exact fillet radii and the surfacing of
    a 27-year-old moulding cannot be recovered from a hand sketch and two
    angled photographs. Print it, offer it up to the lever, and adjust the
    parameters below.

WHAT THE PHOTOS CORRECTED
    - The indicator line is a contrasting CREAM STRIPE across the top face,
      not an open groove. It is moulded in as a second material. Modelled
      here as a shallow channel so it can either be printed as a channel and
      filled, or used as the layer marker for a filament change. Turn it off
      with --no-line for the skull / diamond / spade faces.
    - The socket is a KEYED T-SLOT in a separate cream insert (marked "15"),
      not the two parallel slots the bottom-view sketch implied. Modelled as
      the T here. The 3.00 blade thickness from the sketch is retained as the
      stem thickness; the crossbar is taken from the photograph and is the
      least trustworthy dimension in the file.

COORDINATES
    X  width,  0 at the centreline, +/- 8.25 at the base
    Y  height, 0 at the base, 20.32 at the crown
    Z  depth,  0 at the front face, 16.50 at the deepest point of the rear
    Units are millimetres. 1 unit = 1 mm on import.
"""

import argparse
import math
import struct

# --------------------------------------------------------------------------
# PARAMETERS  (all mm; see the orthographic sheet for provenance)
# --------------------------------------------------------------------------
W_BASE      = 16.50   # width at the base                    [both views agreed]
W_TOP       =  9.00   # width across the top face      [mean of 8.87 and 9.11]
H           = 20.32   # overall height                       [both views agreed]
D_BASE      = 12.86   # depth of the flat base contact patch
D_MAX       = 16.50   # deepest point of the rear overhang   [reconciled]
Z_CROWN     =  3.00   # where the crown sits, measured back from the front face

WALL        =  2.50   # shell wall thickness                 [back view]

# --------------------------------------------------------------------------
# PROFILE BREAKPOINTS  (fractions of H, never absolute heights)
#
# These used to be absolute millimetre heights, which quietly made the model
# non-parametric in its own height: a taper hardcoded to run from y=12.0 to
# y=19.0 does nothing whatever on a 12 mm part, so correcting H on its own
# would have produced a straight-sided slug rather than a shorter knob — a
# second wrong shape that looked like a fix. Held as fractions, the silhouette
# survives a corrected envelope. At H = 20.32 they reproduce the previous
# geometry exactly, vertex for vertex.
# --------------------------------------------------------------------------
F_TAPER_LO  = 12.00 / 20.32   # width holds full up to here
F_TAPER_HI  = 19.00 / 20.32   # ...and has reached W_TOP by here
F_CROWN     = 17.20 / 20.32   # front face begins rolling into the crown
F_REAR_FULL =  8.50 / 20.32   # rear has reached its full overhang
F_REAR_TOP  = 16.90 / 20.32   # rear top edge; above this the top face slopes
F_CEILING   = 15.00 / 20.32   # cavity roof

Y_REAR_TOP  = F_REAR_TOP  * H   # height of the rear top edge
Y_REAR_FULL = F_REAR_FULL * H   # height at which the rear reaches full depth
Y_CEILING   = F_CEILING   * H   # inside height of the cavity roof

# Socket. Note the constraint that caught a bug on the first pass: at y=0 the
# part is only D_BASE deep, so the cavity there is (D_BASE - 2*WALL) = 7.86 mm
# front-to-back. Anything wider than that pushes straight out through the rear
# wall. The socket is therefore derived from the cavity at the base rather than
# positioned by hand.
BLADE_T     =  3.00   # crossbar thickness, Z -> the lever blade  [bottom view]
CROSSBAR_W  =  7.20   # crossbar width, X                    [from photo, soft]
STEM_W      =  2.80   # stem width, X                        [from photo, soft]
STEM_L      =  2.50   # stem length, Z                       [from photo, soft]
SOCKET_H    =  8.00   # how far the socket rises inside the shell
SOCKET_CLEAR =  0.25  # inset from the cavity wall

LINE_W      =  1.60   # indicator stripe width               [from photo, soft]
LINE_D      =  0.55   # channel depth

RING_PTS    = 96      # points around each cross-section
SQUARE_BASE = 4.6     # superellipse exponent low down (higher = squarer)
SQUARE_TOP  = 3.0     # ...and near the crown


# --------------------------------------------------------------------------
# PROFILE
# --------------------------------------------------------------------------
def smoothstep(edge0: float, edge1: float, x: float) -> float:
    if edge1 == edge0:
        return 0.0
    t = min(1.0, max(0.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def width_at(y: float) -> float:
    """Front-view silhouette: near-vertical flanks, then a taper to the top face."""
    return W_BASE + (W_TOP - W_BASE) * smoothstep(F_TAPER_LO * H, F_TAPER_HI * H, y)


def z_front(y: float) -> float:
    """The front face is flat and vertical until it rolls over into the crown."""
    return Z_CROWN * smoothstep(F_CROWN * H, H, y)


def z_back(y: float) -> float:
    """
    Rear edge. Kicks out from the base contact patch to the full overhang, holds
    it through the middle, then follows the sloped top face down to the crown.
    """
    if y <= Y_REAR_FULL:
        return D_BASE + (D_MAX - D_BASE) * smoothstep(0.0, Y_REAR_FULL, y)
    if y <= Y_REAR_TOP:
        return D_MAX
    # linear along the sloped top face, so the top reads as a plane not a dome
    t = (y - Y_REAR_TOP) / (H - Y_REAR_TOP)
    return D_MAX + (Z_CROWN - D_MAX) * t


def squareness(y: float) -> float:
    return SQUARE_BASE + (SQUARE_TOP - SQUARE_BASE) * smoothstep(0.0, H, y)


def levels(count: int = 80) -> list[float]:
    """
    Cross-section heights, graded so they bunch toward the crown where the
    section is changing fastest. Deliberately a single smooth curve rather than
    banded step sizes — stepping the spacing leaves a visible shading seam
    across the flank at every place the step changes.
    """
    return [H * (1.0 - (1.0 - i / count) ** 1.7) for i in range(count + 1)]


def ring(y: float, inset: float = 0.0, pts_n: int | None = None) -> list[tuple[float, float, float]] | None:
    """
    One horizontal cross-section as a superellipse. `inset` shrinks it for the
    inner wall of the shell. Returns None once the section has closed up.
    """
    zf, zb = z_front(y), z_back(y)
    a = width_at(y) / 2.0 - inset
    b = (zb - zf) / 2.0 - inset
    if a <= 0.25 or b <= 0.25:
        return None
    zc = (zf + zb) / 2.0
    n = squareness(y)
    e = 2.0 / n

    n_pts = pts_n or RING_PTS
    pts = []
    for i in range(n_pts):
        t = 2.0 * math.pi * i / n_pts
        ct, st = math.cos(t), math.sin(t)
        x = a * math.copysign(abs(ct) ** e, ct)
        z = zc + b * math.copysign(abs(st) ** e, st)
        pts.append((x, y, z))
    return pts


def carve_line(pts: list[tuple[float, float, float]]) -> list[tuple[float, float, float]]:
    """
    Press the indicator channel into the front-facing half of a section. Applied
    to every section, it runs up the front face and over the crown in one pass —
    which is where the photograph shows the cream stripe sitting.
    """
    out = []
    for (x, y, z) in pts:
        zf, zb = z_front(y), z_back(y)
        zc = (zf + zb) / 2.0
        if z < zc and abs(x) < LINE_W:
            # cosine falloff, so the channel has soft walls rather than a V
            k = 0.5 * (1.0 + math.cos(math.pi * abs(x) / LINE_W))
            z += LINE_D * k
        out.append((x, y, z))
    return out



# --------------------------------------------------------------------------
# GLYPH LIBRARY — the front face as a carveable canvas
# --------------------------------------------------------------------------
# The factory knob has a single moulded line on its face. That face is the only
# free surface on the part: the knob still has to press-fit the same lever and
# clear the same bezel opening, so a different face is a different top surface
# on identical base geometry.
#
# Each glyph is a 2D signed-distance function in a normalised frame where the
# glyph occupies roughly [-1, 1] in u (across the width) and v (up the face).
# Negative is inside. `carve_glyph` samples it per ring point and pushes the
# surface back, so the glyph is pressed into the existing loft rather than
# booleaned onto it — which keeps every section watertight for free.
#
# These mirror src/lib/faceDesigns.ts. Add one here and one there, and keep the
# ids identical or the renders will not match what the picker offers.

GLYPH_CY = 11.40     # centre height of the glyph on the front face, mm
GLYPH_R = 4.30       # half-size of the glyph box, mm (8.6mm across a 16.3mm face)
GLYPH_DEPTH = 0.72   # carve depth, mm — deeper than the classic channel,
                     # because a glyph has to read across a curved face where
                     # a straight line only has to read along one
GLYPH_EDGE = 0.16    # SDF units over which the carve fades in, for soft walls


def _sd_segment(px, py, ax, ay, bx, by):
    """Distance from a point to a line segment. The workhorse for stroke glyphs."""
    pax, pay = px - ax, py - ay
    bax, bay = bx - ax, by - ay
    denom = bax * bax + bay * bay
    h = 0.0 if denom == 0 else max(0.0, min(1.0, (pax * bax + pay * bay) / denom))
    return math.hypot(pax - bax * h, pay - bay * h)


def _sd_polyline(u, v, pts, w):
    return min(_sd_segment(u, v, *pts[i], *pts[i + 1]) for i in range(len(pts) - 1)) - w


def _sd_circle(u, v, cx, cy, r):
    return math.hypot(u - cx, v - cy) - r


def _sd_ngon(u, v, n, r):
    """Regular n-gon centred on the origin, flat-top orientation."""
    ang = math.atan2(v, u)
    seg = 2.0 * math.pi / n
    a = ang - seg * round(ang / seg)
    return math.cos(a) * math.hypot(u, v) - r * math.cos(seg / 2.0)


def _glyph_sd(name: str, u: float, v: float) -> float:
    """Signed distance to the glyph. Negative inside the carved region."""
    if name == "cross":
        return min(
            _sd_segment(u, v, -0.72, -0.72, 0.72, 0.72),
            _sd_segment(u, v, -0.72, 0.72, 0.72, -0.72),
        ) - 0.17

    if name == "chevron":
        # Two stacked, not one. A single chevron at this size reads as a tick.
        up = _sd_polyline(u, v, [(-0.72, 0.06), (0.0, 0.66), (0.72, 0.06)], 0.15)
        lo = _sd_polyline(u, v, [(-0.72, -0.62), (0.0, -0.02), (0.72, -0.62)], 0.15)
        return min(up, lo)

    if name == "hex":
        outer = _sd_ngon(u, v, 6, 0.86)
        return max(outer, -(_sd_ngon(u, v, 6, 0.86) + 0.30))   # ring, not a plate

    if name == "crosshair":
        ring_ = abs(_sd_circle(u, v, 0.0, 0.0, 0.52)) - 0.13
        ticks = min(
            _sd_segment(u, v, 0.0, 0.74, 0.0, 0.98),
            _sd_segment(u, v, 0.0, -0.74, 0.0, -0.98),
            _sd_segment(u, v, 0.74, 0.0, 0.98, 0.0),
            _sd_segment(u, v, -0.74, 0.0, -0.98, 0.0),
        ) - 0.12
        return min(ring_, ticks)

    if name == "diamond":
        d = (abs(u) + abs(v) - 0.90) * 0.7071
        return abs(d) - 0.14                                    # outline

    if name == "spade":
        # Filled silhouette: two shoulders, a point, and a stem.
        body = min(
            _sd_circle(u, v, -0.34, -0.10, 0.40),
            _sd_circle(u, v, 0.34, -0.10, 0.40),
        )
        point = _sd_polyline(u, v, [(0.0, 0.86), (-0.72, -0.10), (0.72, -0.10)], 0.0)
        # crude fill of the triangle: inside when below both upper edges
        tri = max(
            (v - 0.86) * 0.0 + (_sd_segment(u, v, 0.0, 0.86, -0.72, -0.10) if u < 0
                                else _sd_segment(u, v, 0.0, 0.86, 0.72, -0.10)) - 0.02,
            -(v + 0.10),
        )
        stem = _sd_polyline(u, v, [(0.0, -0.20), (0.0, -0.80)], 0.13)
        flare = _sd_polyline(u, v, [(-0.30, -0.86), (0.30, -0.86)], 0.10)
        del point
        return min(body, tri, stem, flare)

    if name == "skull":
        # Cranium plus jaw, with the eyes and nose left UNCARVED so they stand
        # proud inside the recess. That is what makes a skull read at 6mm —
        # a flat silhouette at this size is a blob.
        cranium = _sd_circle(u, v, 0.0, 0.22, 0.72)
        jaw = max(max(abs(u) - 0.44, abs(v + 0.62) - 0.30), 0.0) - 0.06
        jaw = max(abs(u) - 0.44, abs(v + 0.62) - 0.28)
        solid = min(cranium, jaw)
        eyes = min(
            _sd_circle(u, v, -0.30, 0.28, 0.21),
            _sd_circle(u, v, 0.30, 0.28, 0.21),
        )
        nose = _sd_polyline(u, v, [(0.0, -0.06), (-0.13, -0.28), (0.13, -0.28), (0.0, -0.06)], 0.0)
        nose = _sd_circle(u, v, 0.0, -0.18, 0.13)
        return max(solid, -min(eyes, nose))

    # "classic" and anything unknown fall back to the factory line, which is
    # handled by carve_line rather than here.
    return 1.0


def carve_glyph(pts, name: str):
    """
    Press a glyph into the front-facing half of a section.

    Applied to every section in turn, the glyph emerges across the stack of
    rings. Points behind the mid-line are untouched, so the back of the knob is
    unaffected regardless of which design is selected.
    """
    out = []
    for (x, y, z) in pts:
        zf, zb = z_front(y), z_back(y)
        zc = (zf + zb) / 2.0
        if z < zc:
            u = x / GLYPH_R
            v = (y - GLYPH_CY) / GLYPH_R
            if abs(u) <= 1.35 and abs(v) <= 1.35:
                d = _glyph_sd(name, u, v)
                # smoothstep from the edge inwards gives soft channel walls,
                # the same treatment the classic line gets from its cosine.
                k = 1.0 - smoothstep(-GLYPH_EDGE, GLYPH_EDGE, d)
                z += GLYPH_DEPTH * k
        out.append((x, y, z))
    return out


# --------------------------------------------------------------------------
# MESH
# --------------------------------------------------------------------------
class Mesh:
    def __init__(self) -> None:
        self.v: list[tuple[float, float, float]] = []
        self.f: list[tuple[int, int, int]] = []

    def add_v(self, p) -> int:
        self.v.append(p)
        return len(self.v) - 1

    def tri(self, a: int, b: int, c: int) -> None:
        # Reversed on the way in. Every ring, cap and box in this file was
        # authored with a consistent winding that happens to point INWARD —
        # verified by signed volume, which came out at -2,873 mm^3 for the
        # whole part. Flipping once here fixes the loft, the cavity and the
        # socket boxes together and keeps them consistent with each other,
        # which is why this is a single reversal rather than eight edits to
        # the callers. Matters beyond rendering: an STL with inverted normals
        # is a slicer's problem to guess at, and guessing is not a spec.
        self.f.append((a, c, b))

    def quad(self, a: int, b: int, c: int, d: int) -> None:
        self.tri(a, b, c)
        self.tri(a, c, d)

    def add_ring(self, pts) -> list[int]:
        return [self.add_v(p) for p in pts]

    def bridge(self, lower: list[int], upper: list[int], flip: bool = False) -> None:
        """Skin between two rings of equal point count."""
        n = len(lower)
        for i in range(n):
            j = (i + 1) % n
            if flip:
                self.quad(lower[i], upper[i], upper[j], lower[j])
            else:
                self.quad(lower[i], lower[j], upper[j], upper[i])

    def cap(self, loop: list[int], flip: bool = False, apex_y: float | None = None) -> None:
        """
        Close a ring with a fan through its centroid. `apex_y` lifts that centroid
        to a stated height — the crown sections close a fraction of a millimetre
        below H, and without this the part finishes short of its own overall
        height, which is the one dimension two views agreed on exactly.
        """
        cx = sum(self.v[i][0] for i in loop) / len(loop)
        cy = sum(self.v[i][1] for i in loop) / len(loop) if apex_y is None else apex_y
        cz = sum(self.v[i][2] for i in loop) / len(loop)
        c = self.add_v((cx, cy, cz))
        n = len(loop)
        for i in range(n):
            j = (i + 1) % n
            if flip:
                self.tri(c, loop[j], loop[i])
            else:
                self.tri(c, loop[i], loop[j])

    def box(self, x0, x1, y0, y1, z0, z1) -> None:
        p = [
            (x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1),
            (x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1),
        ]
        b = [self.add_v(q) for q in p]
        self.quad(b[0], b[3], b[2], b[1])   # bottom
        self.quad(b[4], b[5], b[6], b[7])   # top
        self.quad(b[0], b[1], b[5], b[4])   # front  (z0)
        self.quad(b[2], b[3], b[7], b[6])   # back   (z1)
        self.quad(b[1], b[2], b[6], b[5])   # right  (x1)
        self.quad(b[3], b[0], b[4], b[7])   # left   (x0)

    def bounds(self):
        xs = [p[0] for p in self.v]
        ys = [p[1] for p in self.v]
        zs = [p[2] for p in self.v]
        return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))


def build(glyph: str = "classic", res: int = 80) -> Mesh:
    """`glyph` is an id from the library above, "classic" for the factory line,
    or "blank" for an uncarved face. `res` raises the section count for render
    meshes — the default is enough to print, not enough to photograph.

    Ring density is DERIVED from res rather than left at the module constant.
    Raising only the vertical count is what made the first render pass produce
    horizontal banding instead of glyphs: at res=260 the sections were 0.09mm
    apart vertically while the ring points were 0.81mm apart horizontally, a
    9x mismatch, so every glyph resolved along one axis and aliased along the
    other. The two have to move together."""
    m = Mesh()
    ys = levels(res)
    # ~0.8mm at the default, scaling down as res climbs.
    pts_n = max(RING_PTS, int(res * 3.6))

    # ---- outer skin -------------------------------------------------------
    outer: list[list[int]] = []
    for y in ys:
        pts = ring(y, pts_n=pts_n)
        if pts is None:
            break
        if glyph == "classic":
            pts = carve_line(pts)
        elif glyph != "blank":
            pts = carve_glyph(pts, glyph)
        outer.append(m.add_ring(pts))
    for lo, up in zip(outer, outer[1:]):
        m.bridge(lo, up)
    m.cap(outer[-1], apex_y=H)          # crown, pinned to the true 20.32

    # ---- inner skin (cavity) ---------------------------------------------
    inner: list[list[int]] = []
    for y in ys:
        if y > Y_CEILING:
            break
        pts = ring(y, inset=WALL, pts_n=pts_n)
        if pts is None:
            break
        inner.append(m.add_ring(pts))
    for lo, up in zip(inner, inner[1:]):
        m.bridge(lo, up, flip=True)     # faces point into the cavity
    m.cap(inner[-1], flip=True)         # cavity roof

    # ---- rim: joins the outer and inner skins at the base -----------------
    lo_o, lo_i = outer[0], inner[0]
    n = len(lo_o)
    for i in range(n):
        j = (i + 1) % n
        m.quad(lo_o[i], lo_i[i], lo_i[j], lo_o[j])

    # ---- socket: a solid block with a T-shaped through-slot ---------------
    # Built as six convex boxes tiling "block minus T" rather than as a
    # boolean, so every piece stays trivially watertight. Their union is the
    # socket. Sized off the cavity at the base so it cannot escape the shell.
    cav_z0 = z_front(0.0) + WALL
    cav_z1 = z_back(0.0) - WALL
    bx = W_BASE / 2.0 - WALL - SOCKET_CLEAR
    bz0 = cav_z0 + SOCKET_CLEAR
    bz1 = cav_z1 - SOCKET_CLEAR

    t_depth = BLADE_T + STEM_L
    margin = (bz1 - bz0 - t_depth) / 2.0
    if margin < 0.2:
        raise SystemExit(
            f"socket {t_depth:.2f} deep will not fit the {bz1 - bz0:.2f} cavity "
            f"at the base — reduce BLADE_T or STEM_L"
        )
    tz0 = bz0 + margin              # front of the crossbar
    tz1 = tz0 + BLADE_T             # crossbar / stem junction
    tz2 = tz1 + STEM_L              # back of the stem
    cw, sw = CROSSBAR_W / 2.0, STEM_W / 2.0

    m.box(-bx, bx, 0.0, SOCKET_H, bz0, tz0)      # ahead of the crossbar
    m.box(-bx, -cw, 0.0, SOCKET_H, tz0, tz1)     # left of the crossbar
    m.box(cw, bx, 0.0, SOCKET_H, tz0, tz1)       # right of the crossbar
    m.box(-bx, -sw, 0.0, SOCKET_H, tz1, tz2)     # left of the stem
    m.box(sw, bx, 0.0, SOCKET_H, tz1, tz2)       # right of the stem
    m.box(-bx, bx, 0.0, SOCKET_H, tz2, bz1)      # behind the stem

    return m


# --------------------------------------------------------------------------
# OUTPUT
# --------------------------------------------------------------------------
def write_obj(m: Mesh, path: str, name: str) -> None:
    with open(path, "w") as fh:
        fh.write("# NLA Fabrication - HVAC slider knob, 96-98 Civic EK/EJ\n")
        fh.write("# Units: millimetres. 1 unit = 1 mm.\n")
        fh.write(f"o {name}\n")
        for x, y, z in m.v:
            fh.write(f"v {x:.4f} {y:.4f} {z:.4f}\n")
        for a, b, c in m.f:
            fh.write(f"f {a + 1} {b + 1} {c + 1}\n")


def write_stl(m: Mesh, path: str) -> None:
    with open(path, "wb") as fh:
        fh.write(b"NLA Fabrication HVAC slider knob - mm".ljust(80, b" "))
        fh.write(struct.pack("<I", len(m.f)))
        for a, b, c in m.f:
            pa, pb, pc = m.v[a], m.v[b], m.v[c]
            ux, uy, uz = (pb[i] - pa[i] for i in range(3))
            vx, vy, vz = (pc[i] - pa[i] for i in range(3))
            nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
            ln = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
            fh.write(struct.pack("<3f", nx / ln, ny / ln, nz / ln))
            for p in (pa, pb, pc):
                fh.write(struct.pack("<3f", *p))
            fh.write(struct.pack("<H", 0))


ALL_GLYPHS = ["classic", "cross", "chevron", "hex", "crosshair",
              "diamond", "spade", "skull", "blank"]


def signed_volume(m: Mesh) -> float:
    """Divergence-theorem volume. Positive means the surface faces outward.

    This is the cheapest possible check that the mesh is not inside-out, and
    it is here because the model WAS inside-out for its whole life until a
    render made it visible. A wrong sign is invisible in any viewer that
    renders double-sided, and it is a slicer's problem to guess at afterwards.
    """
    t = 0.0
    for (a, b, c) in m.f:
        p, q, r = m.v[a], m.v[b], m.v[c]
        t += (p[0] * (q[1] * r[2] - q[2] * r[1])
              - p[1] * (q[0] * r[2] - q[2] * r[0])
              + p[2] * (q[0] * r[1] - q[1] * r[0])) / 6.0
    return t


PETG_DENSITY = 1.27   # g/cm^3


def emit(glyph: str, out: str, res: int, stl: bool) -> None:
    m = build(glyph, res)
    vol = signed_volume(m)
    if vol <= 0:
        raise SystemExit(
            f"{glyph}: signed volume {vol:.1f} mm^3 — the mesh is inside-out"
        )
    write_obj(m, out + ".obj", f"knob_{glyph}")
    if stl:
        write_stl(m, out + ".stl")

    (x0, x1), (y0, y1), (z0, z1) = m.bounds()
    # Every variant must stay dimensionally identical outside the carve — a
    # glyph that changed the envelope would no longer fit the bezel opening.
    ok = (abs((x1 - x0) - W_BASE) < 0.05 and abs((y1 - y0) - H) < 0.05)
    grams = vol / 1000.0 * PETG_DENSITY
    print(f"  {glyph:<10} {len(m.v):>7,}v {len(m.f):>7,}f   "
          f"X {x1-x0:6.3f}  Y {y1-y0:6.3f}  Z {z1-z0:6.3f}   "
          f"{grams:5.2f} g   {'ok' if ok else 'ENVELOPE DRIFT'}")
    if not ok:
        raise SystemExit(f"{glyph} changed the part envelope — it would not fit")


# --------------------------------------------------------------------------
# MEASURED DIMENSIONS FROM THE COMMAND LINE
#
# Every number in the PARAMETERS block came off a hand sketch whose views did
# not reconcile, and the result is a near-cube for what should be a flat cap.
# Correcting that needs calipers on the real part, not a better guess — so the
# job of this section is to make the correction cost one command instead of a
# source edit, and to fail loudly on a combination that cannot be produced.
#
#   python3 design/knob_model.py --width 14.2 --height 12.0 --depth 9.4 --all
#
# Flag -> constant. Only things you can physically put a caliper across are
# here; the profile breakpoints are fractions of H and follow it on their own.
# --------------------------------------------------------------------------
DIMS: dict[str, tuple[str, str]] = {
    "width":      ("W_BASE",     "overall width across the base"),
    "height":     ("H",          "overall height, base to crown"),
    "depth":      ("D_MAX",      "deepest point front-to-back"),
    "top-width":  ("W_TOP",      "width across the flat top face"),
    "base-depth": ("D_BASE",     "front-to-back at the base contact patch"),
    "crown":      ("Z_CROWN",    "crown setback from the front face"),
    "wall":       ("WALL",       "shell wall thickness"),
    "blade":      ("BLADE_T",    "lever blade thickness — drives socket fit"),
    "crossbar":   ("CROSSBAR_W", "socket crossbar width"),
    "stem-width": ("STEM_W",     "socket stem width"),
    "stem-len":   ("STEM_L",     "socket stem length"),
}


def apply_dimensions(args: argparse.Namespace) -> list[str]:
    """Rebind measured constants, recompute what derives from them, and reject
    combinations that cannot be built. Returns a log of what changed.

    The checks matter more than the overrides. A wrong dimension that still
    produces a watertight mesh is exactly the failure that put a cube on the
    render list in the first place — every guard here turns one of those into
    a build that stops."""
    g = globals()
    changed: list[str] = []

    for flag, (const, _) in DIMS.items():
        value = getattr(args, flag.replace("-", "_"))
        if value is None:
            continue
        if value <= 0:
            raise SystemExit(f"--{flag} must be positive, got {value}")
        g[const] = float(value)
        changed.append(f"{const} {value:.2f}")

    # Heights expressed as fractions of H have to follow it.
    g["Y_REAR_TOP"] = F_REAR_TOP * H
    g["Y_REAR_FULL"] = F_REAR_FULL * H
    g["Y_CEILING"] = F_CEILING * H

    if W_TOP > W_BASE:
        raise SystemExit(
            f"--top-width {W_TOP:.2f} is wider than --width {W_BASE:.2f}; the "
            f"taper would flare outward"
        )
    if D_BASE > D_MAX:
        raise SystemExit(
            f"--base-depth {D_BASE:.2f} exceeds --depth {D_MAX:.2f}; the base "
            f"would overhang the rear"
        )
    if 2.0 * WALL >= D_BASE:
        raise SystemExit(
            f"{WALL:.2f} mm walls leave no cavity in a {D_BASE:.2f} mm base — "
            f"the lever has nowhere to go"
        )
    if 2.0 * WALL >= W_BASE:
        raise SystemExit(f"{WALL:.2f} mm walls leave no cavity in a {W_BASE:.2f} mm width")
    if Y_CEILING <= SOCKET_H:
        raise SystemExit(
            f"cavity roof sits at {Y_CEILING:.2f} mm, at or below the "
            f"{SOCKET_H:.2f} mm socket — the part is too short to engage the lever"
        )
    return changed


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Parametric HVAC slider knob. Pass measured dimensions to "
                    "correct the envelope; see --help for the caliper list.",
    )
    for flag, (const, help_text) in DIMS.items():
        ap.add_argument(f"--{flag}", type=float, default=None,
                        metavar="MM", help=f"{help_text} (default {globals()[const]:.2f})")
    ap.add_argument("--no-line", action="store_true",
                    help="omit the indicator channel (blank face for custom designs)")
    ap.add_argument("--glyph", default=None,
                    help=f"one of: {', '.join(ALL_GLYPHS)}")
    ap.add_argument("--all", action="store_true",
                    help="emit every glyph in the library")
    ap.add_argument("--res", type=int, default=80,
                    help="cross-sections; raise for render meshes")
    ap.add_argument("--out", default="design/hvac-slider-knob")
    args = ap.parse_args()

    changed = apply_dimensions(args)

    print(f"targets     W {W_BASE:.2f}  H {H:.2f}  D {D_MAX:.2f} mm   res={args.res}")
    if changed:
        print(f"overridden  {', '.join(changed)}")
    else:
        # Said every run, because the sketch-derived envelope is the open
        # defect on this part and a silent default is how it got shipped into
        # a render set in the first place.
        print("            SKETCH-DERIVED, UNVERIFIED — measure the real part "
              "and pass --width/--height/--depth")
    if args.all:
        for g in ALL_GLYPHS:
            emit(g, f"{args.out}-{g}", args.res, stl=False)
        return

    glyph = args.glyph or ("blank" if args.no_line else "classic")
    emit(glyph, args.out, args.res, stl=True)
    print(f"wrote       {args.out}.obj / .stl")


if __name__ == "__main__":
    main()
