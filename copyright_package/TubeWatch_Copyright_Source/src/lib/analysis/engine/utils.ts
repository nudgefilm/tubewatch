export function safeNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  
  export function safeString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
  }
  
  export function safeArray<T>(value: unknown, fallback: T[] = []): T[] {
    return Array.isArray(value) ? (value as T[]) : fallback;
  }
  
  export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
  
  export function average(numbers: number[]): number {
    if (!numbers.length) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
  
  export function median(numbers: number[]): number {
    if (!numbers.length) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  export function stdDev(numbers: number[]): number {
    if (numbers.length <= 1) return 0;
    const avg = average(numbers);
    const variance =
      average(numbers.map((n) => Math.pow(n - avg, 2)));
    return Math.sqrt(variance);
  }
  
  export function daysBetween(from: Date, to: Date): number {
    const diff = to.getTime() - from.getTime();
    return Math.max(0, diff / (1000 * 60 * 60 * 24));
  }
  
  export function parseIsoDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  
  export function coefficientOfVariation(numbers: number[]): number {
    const avg = average(numbers);
    if (avg === 0) return 0;
    return stdDev(numbers) / avg;
  }
  
  export function ratio(part: number, total: number): number {
    if (total <= 0) return 0;
    return part / total;
  }