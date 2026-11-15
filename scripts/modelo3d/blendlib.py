"""Lector mínimo de archivos .blend (sin Blender): usa el SDNA del propio archivo.
Solo lee datos; nunca ejecuta nada del archivo."""
import re
import struct


class Blend:
    def __init__(self, ruta):
        self.buf = buf = open(ruta, "rb").read()
        if buf[:7] != b"BLENDER":
            raise ValueError("no es un .blend sin comprimir")
        self.ptr = 8 if buf[7:8] == b"-" else 4
        self.end = "<" if buf[8:9] == b"v" else ">"
        self.P = "Q" if self.ptr == 8 else "I"
        self.version = buf[9:12].decode()
        pos, self.bloques = 12, []
        while pos < len(buf):
            code = buf[pos:pos + 4].rstrip(b"\0")
            size, = struct.unpack_from(self.end + "i", buf, pos + 4)
            old, = struct.unpack_from(self.end + self.P, buf, pos + 8)
            sdna, nr = struct.unpack_from(self.end + "ii", buf, pos + 8 + self.ptr)
            off = pos + 16 + self.ptr
            self.bloques.append({"code": code, "size": size, "old": old, "sdna": sdna, "nr": nr, "off": off})
            pos = off + size
            if code == b"ENDB":
                break
        self.por_ptr = {b["old"]: b for b in self.bloques}
        self._sdna(next(b for b in self.bloques if b["code"] == b"DNA1")["off"])

    def _sdna(self, o):
        buf, e = self.buf, self.end

        def cadenas(o, n):
            out = []
            for _ in range(n):
                k = buf.index(b"\0", o)
                out.append(buf[o:k].decode("latin1"))
                o = k + 1
            return out, o

        al = lambda o: (o + 3) & ~3
        o += 8
        n, = struct.unpack_from(e + "i", buf, o); nombres, o = cadenas(o + 4, n); o = al(o) + 4
        n, = struct.unpack_from(e + "i", buf, o); self.tipos, o = cadenas(o + 4, n); o = al(o) + 4
        self.tlen = struct.unpack_from(e + f"{len(self.tipos)}h", buf, o); o = al(o + 2 * len(self.tipos)) + 4
        n, = struct.unpack_from(e + "i", buf, o); o += 4
        self.structs = {}
        self.struct_por_idx = []
        for _ in range(n):
            t, nf = struct.unpack_from(e + "hh", buf, o); o += 4
            campos, off = {}, 0
            for _ in range(nf):
                ft, fn = struct.unpack_from(e + "hh", buf, o); o += 4
                nombre, tipo = nombres[fn], self.tipos[ft]
                dims = [int(x) for x in re.findall(r"\[(\d+)\]", nombre)]
                k = 1
                for d in dims:
                    k *= d
                es_ptr = nombre.startswith("*") or nombre.startswith("(*")
                tam = (self.ptr if es_ptr else self.tlen[ft]) * k
                limpio = re.sub(r"[\*\(\)]", "", nombre.split("[")[0])
                campos[limpio] = {"off": off, "tipo": tipo, "ptr": es_ptr, "n": k}
                off += tam
            nombre_t = self.tipos[t]
            self.structs[nombre_t] = {"campos": campos, "tam": self.tlen[t]}
            self.struct_por_idx.append(nombre_t)

    # ---------------------------------------------------------------- lectura
    def tipo(self, b):
        return self.struct_por_idx[b["sdna"]]

    def campo(self, tipo, nombre):
        return self.structs[tipo]["campos"][nombre]

    def val(self, base, tipo, nombre):
        c = self.campo(tipo, nombre)
        if c["ptr"]:
            return struct.unpack_from(self.end + self.P, self.buf, base + c["off"])[0]
        fmt = {"int": "i", "float": "f", "short": "h", "char": "b", "uchar": "B", "uint": "I", "ushort": "H"}[c["tipo"]]
        if c["n"] > 1 and c["tipo"] != "char":
            return list(struct.unpack_from(self.end + fmt * c["n"], self.buf, base + c["off"]))
        if c["n"] > 1:
            return self.buf[base + c["off"]: base + c["off"] + c["n"]].split(b"\0")[0].decode("latin1")
        return struct.unpack_from(self.end + fmt, self.buf, base + c["off"])[0]

    def bloque(self, puntero):
        return self.por_ptr.get(puntero)

    def nombre_id(self, b):
        return self.val(b["off"] + self.campo(self.tipo(b), "id")["off"], "ID", "name")

    def lista(self, base_listbase):
        """Recorre un ListBase: devuelve los bloques enlazados."""
        p = struct.unpack_from(self.end + self.P, self.buf, base_listbase)[0]
        out = []
        while p and p in self.por_ptr:
            b = self.por_ptr[p]
            out.append(b)
            p = struct.unpack_from(self.end + self.P, self.buf, b["off"])[0]   # next es el primer campo
        return out
