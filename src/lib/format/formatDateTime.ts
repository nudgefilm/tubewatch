const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Deterministic date/time formatter — identical output on server and client.
 * Output: "YYYY. MM. DD. HH:mm" in Asia/Seoul (KST, UTC+9).
 * No locale dependency, no AM/PM.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const kst = new Date(date.getTime() + KST_OFFSET_MS);

  const y = kst.getUTCFullYear();
  const m = pad(kst.getUTCMonth() + 1);
  const d = pad(kst.getUTCDate());
  const h = pad(kst.getUTCHours());
  const min = pad(kst.getUTCMinutes());

  return `${y}. ${m}. ${d}. ${h}:${min}`;
}
