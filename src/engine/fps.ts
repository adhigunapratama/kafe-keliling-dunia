/** Penghitung fps sederhana (rata-rata ±0.5 detik). */
export class FpsMeter {
  private frames = 0;
  private acc = 0;
  fps = 60;
  sample(dt: number) {
    this.frames++; this.acc += dt;
    if (this.acc >= 0.5) { this.fps = this.frames / this.acc; this.frames = 0; this.acc = 0; return true; }
    return false;
  }
}
