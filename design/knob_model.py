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
Y_REAR_TOP  = 16.90   # height of the rear top edge  [H minus the 8.40 rear face]
Y_REAR_FULL =  8.50   # height at which the rear reaches its full depth

WALL        =  2.50   # shell wall thickness                 [back view]
Y_CEILING   = 15.00   # inside height of the cavity roof

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
    return W_BASE + (W_TOP - W_BASE) * smoothstep(12.0, 19.0, y)


def z_front(y: float) -> float:
    """The front face is flat and vertical until it rolls over into the crown."""
    return Z_CROWN * smoothstep(17.2, H, y)


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


def ring(y: float, inset: float = 0.0) -> list[tuple[float, float, float]] | None:
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

    pts = []
    for i in range(RING_PTS):
        t = 2.0 * math.pi * i / RING_PTS
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
        self.f.append((a, b, c))

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


def build(with_line: bool) -> Mesh:
    m = Mesh()
    ys = levels()

    # ---- outer skin -------------------------------------------------------
    outer: list[list[int]] = []
    for y in ys:
        pts = ring(y)
        if pts is None:
            break
        if with_line:
            pts = carve_line(pts)
        outer.append(m.add_ring(pts))
    for lo, up in zip(outer, outer[1:]):
        m.bridge(lo, up)
    m.cap(outer[-1], apex_y=H)          # crown, pinned to the true 20.32

    # ---- inner skin (cavity) ---------------------------------------------
    inner: list[list[int]] = []
    for y in ys:
        if y > Y_CEILING:
            break
        pts = ring(y, inset=WALL)
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-line", action="store_true",
                    help="omit the indicator channel (blank face for custom designs)")
    ap.add_argument("--out", default="design/hvac-slider-knob")
    args = ap.parse_args()

    with_line = not args.no_line
    m = build(with_line)
    name = "knob_classic_line" if with_line else "knob_blank"

    write_obj(m, args.out + ".obj", name)
    write_stl(m, args.out + ".stl")

    (x0, x1), (y0, y1), (z0, z1) = m.bounds()
    print(f"variant     {name}")
    print(f"vertices    {len(m.v)}")
    print(f"triangles   {len(m.f)}")
    print(f"X  {x0:7.3f} .. {x1:7.3f}   ({x1 - x0:6.3f} mm)   target {W_BASE:.2f}")
    print(f"Y  {y0:7.3f} .. {y1:7.3f}   ({y1 - y0:6.3f} mm)   target {H:.2f}")
    print(f"Z  {z0:7.3f} .. {z1:7.3f}   ({z1 - z0:6.3f} mm)   target {D_MAX:.2f}")
    print(f"wrote       {args.out}.obj / .stl")


if __name__ == "__main__":
    main()
