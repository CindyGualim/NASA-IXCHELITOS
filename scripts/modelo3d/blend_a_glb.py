"""Convierte la malla humana de BASEmodel.blend a .glb (glTF 2.0 binario) sin Blender.

- Aplica el modificador Mirror (eje X) del archivo: el .blend guarda medio cuerpo.
- Separa el cuerpo en zonas (head, neck, torso, arms, legs), una malla con nombre por zona, para que
  la web pueda colorear cada una según el estado del motor.
- Convierte de Z arriba (Blender) a Y arriba (glTF) y centra el modelo en el origen, con los pies en y=0.
Uso: python -I blend_a_glb.py entrada.blend salida.glb
"""
import json
import math
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from blendlib import Blend  # noqa: E402

entrada, salida = sys.argv[1], Path(sys.argv[2])
B = Blend(entrada)
ob = next(b for b in B.bloques if b["code"] == b"OB" and B.val(b["off"], "Object", "type") == 1)
me = B.bloque(B.val(ob["off"], "Object", "data"))

mv = B.bloque(B.val(me["off"], "Mesh", "mvert")); tv = B.structs["MVert"]["tam"]
verts = [B.val(mv["off"] + i * tv, "MVert", "co") for i in range(B.val(me["off"], "Mesh", "totvert"))]
mp = B.bloque(B.val(me["off"], "Mesh", "mpoly")); tp = B.structs["MPoly"]["tam"]
ml = B.bloque(B.val(me["off"], "Mesh", "mloop")); tl = B.structs["MLoop"]["tam"]
loops = [B.val(ml["off"] + i * tl, "MLoop", "v") for i in range(B.val(me["off"], "Mesh", "totloop"))]
polys = []
for i in range(B.val(me["off"], "Mesh", "totpoly")):
    s, n = B.val(mp["off"] + i * tp, "MPoly", "loopstart"), B.val(mp["off"] + i * tp, "MPoly", "totloop")
    polys.append(loops[s:s + n])

# ---- Mirror en X (flag AXIS_X); los vértices sobre el plano central se comparten
mirror = [m for m in B.lista(ob["off"] + B.campo("Object", "modifiers")["off"]) if B.tipo(m) == "MirrorModifierData"]
if mirror and B.val(mirror[0]["off"], "MirrorModifierData", "flag") & (1 << 3):
    UMBRAL = 0.02          # algunos vértices centrales quedaron levemente del otro lado (x ≈ -0.015)
    n0 = len(verts)
    espejo = []
    for i in range(n0):                 # solo los originales (la lista crece dentro del ciclo)
        x, y, z = verts[i]
        if abs(x) <= UMBRAL:
            verts[i] = [0.0, y, z]
            espejo.append(i)
        else:
            espejo.append(len(verts))
            verts.append([-x, y, z])
    polys += [[espejo[v] for v in reversed(p)] for p in polys]      # invertir orden: la cara mira afuera
    print(f"mirror: {n0} -> {len(verts)} vértices")

# ---- triángulos (abanico) y normales suaves por vértice
tris = [(p[0], p[k], p[k + 1]) for p in polys for k in range(1, len(p) - 1)]
sub = lambda a, b: [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
cross = lambda a, b: [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
normales = [[0.0, 0.0, 0.0] for _ in verts]
for a, b, c in tris:
    nrm = cross(sub(verts[b], verts[a]), sub(verts[c], verts[a]))
    for v in (a, b, c):
        for k in range(3):
            normales[v][k] += nrm[k]
for nrm in normales:
    L = math.sqrt(sum(x * x for x in nrm)) or 1.0
    for k in range(3):
        nrm[k] /= L


# ---- zonas por geometría (alturas tomadas de los grupos de huesos del propio modelo)
def zona(x, y, z):
    ax = abs(x)
    if z >= 4.25:
        return "head"
    if z >= 4.0 and ax < 0.25:
        return "neck"
    if ax > 0.5 or (ax > 0.45 and z < 3.75):
        return "arms"
    if z < 2.95:
        return "legs"
    return "torso"


# ---- Z arriba -> Y arriba; centrar en x/z y pies en y=0
conv = [[x, z, -y] for x, y, z in verts]
nconv = [[x, z, -y] for x, y, z in normales]
xs, ys, zs = zip(*conv)
cx, cz, y0 = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, min(ys)
conv = [[x - cx, y - y0, z - cz] for x, y, z in conv]

por_zona = {}
for p in polys:      # la zona se decide por cara completa (no por triángulo) para que los bordes no queden en zigzag
    c = [sum(verts[v][k] for v in p) / len(p) for k in range(3)]
    por_zona.setdefault(zona(*c), []).extend((p[0], p[k], p[k + 1]) for k in range(1, len(p) - 1))

# ---- escribir glTF binario
bin_ = bytearray()
accessors, views, meshes, nodes = [], [], [], []


def agregar(datos: bytes, target, **acc):
    while len(bin_) % 4:
        bin_.append(0)
    views.append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(datos), "target": target})
    bin_.extend(datos)
    accessors.append({"bufferView": len(views) - 1, **acc})
    return len(accessors) - 1


for nombre in ("head", "neck", "torso", "arms", "legs"):
    ts = por_zona.get(nombre, [])
    usados = sorted({v for t in ts for v in t})
    local = {v: i for i, v in enumerate(usados)}
    pos = [conv[v] for v in usados]
    nor = [nconv[v] for v in usados]
    idx = [local[v] for t in ts for v in t]
    a_pos = agregar(struct.pack(f"<{3 * len(pos)}f", *[c for p in pos for c in p]), 34962, componentType=5126,
                    count=len(pos), type="VEC3", min=[min(p[k] for p in pos) for k in range(3)],
                    max=[max(p[k] for p in pos) for k in range(3)])
    a_nor = agregar(struct.pack(f"<{3 * len(nor)}f", *[c for p in nor for c in p]), 34962, componentType=5126,
                    count=len(nor), type="VEC3")
    a_idx = agregar(struct.pack(f"<{len(idx)}H", *idx), 34963, componentType=5123, count=len(idx), type="SCALAR")
    meshes.append({"name": nombre, "primitives": [{"attributes": {"POSITION": a_pos, "NORMAL": a_nor}, "indices": a_idx, "material": 0}]})
    nodes.append({"name": nombre, "mesh": len(meshes) - 1})
    print(f"{nombre:6s} {len(ts):5d} triángulos, {len(pos):5d} vértices")

gltf = {
    "asset": {"version": "2.0", "generator": "ixchel blend_a_glb.py (BASEmodel.blend, sin Blender)"},
    "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
    "materials": [{"name": "piel", "pbrMetallicRoughness": {"baseColorFactor": [0.8, 0.8, 0.8, 1], "metallicFactor": 0, "roughnessFactor": 0.8}}],
    "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}],
}
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * (-len(js) % 4)
while len(bin_) % 4:
    bin_.append(0)
total = 12 + 8 + len(js) + 8 + len(bin_)
salida.parent.mkdir(parents=True, exist_ok=True)
with open(salida, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, total))
    f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack("<II", len(bin_), 0x004E4942)); f.write(bin_)
print(f"guardado {salida} ({total / 1024:.0f} KB); alto {max(y for _, y, _ in conv):.2f} unidades")
