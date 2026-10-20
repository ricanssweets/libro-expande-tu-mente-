// Descarga los iconos reales del repositorio (o regenera PNG de respaldo si no hay red).
import { writeFileSync, existsSync } from "node:fs";

const BASE = "https://raw.githubusercontent.com/ricanssweets/libro-expande-tu-mente-/main/";
const files = ["icon-192.png", "icon-512.png"];

for (const f of files) {
  try {
    const res = await fetch(BASE + f);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000 || buf[0] !== 0x89 || buf.toString("latin1", 1, 4) !== "PNG") {
      throw new Error("no parece un PNG válido");
    }
    writeFileSync(f, buf);
    console.log("ok", f, buf.length, "bytes");
  } catch (err) {
    console.log("fallo", f, String(err.message), existsSync(f) ? "(se conserva el local)" : "(sin archivo local)");
  }
}
