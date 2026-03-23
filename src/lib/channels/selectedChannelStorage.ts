/** 클라이언트에서 선택된 `user_channels.id` 유지 (localStorage) */
export const SELECTED_CHANNEL_STORAGE_KEY = "tubewatch_selected_channel_id";

export function readSelectedChannelIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(SELECTED_CHANNEL_STORAGE_KEY);
    return v && v.trim() !== "" ? v.trim() : null;
  } catch {
    return null;
  }
}

export function writeSelectedChannelIdToStorage(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id == null || id.trim() === "") {
      window.localStorage.removeItem(SELECTED_CHANNEL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(SELECTED_CHANNEL_STORAGE_KEY, id.trim());
    }
  } catch {
    /* ignore */
  }
}
