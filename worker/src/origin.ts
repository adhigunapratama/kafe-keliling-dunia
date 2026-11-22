/** Cocokkan origin dengan daftar pola (dipisah koma, "*" = satu bagian nama/port). */
export function originAllowed(origin: string | null, patterns: string): boolean {
  if (!origin) return true; // bukan browser (mis. tes otomatis)
  return patterns.split(',').map((p) => p.trim()).filter(Boolean).some((p) => {
    const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^./:]+') + '$');
    return re.test(origin);
  });
}
