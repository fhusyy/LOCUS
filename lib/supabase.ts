import { createClient } from "@supabase/supabase-js";
import type { StudentProfile, ShortlistItem, ApplicationItem } from "./types";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type SyncState = {
  profile?: StudentProfile;
  targetId?: string;
  completed?: string[];
  shortlist?: ShortlistItem[];
  applications?: ApplicationItem[];
  lastSyncedAt?: string;
};

const STORAGE_KEY = "uniflow_state_v2";

export function loadLocalState(): SyncState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("uniflow-state");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load local state:", err);
    return {};
  }
}

export function saveLocalState(state: SyncState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSyncedAt: new Date().toISOString() }));
  } catch (err) {
    console.warn("Failed to save local state:", err);
  }
}

/**
 * Graceful cloud synchronization with Supabase.
 * Tries cloud tables first; if tables don't exist yet, falls back smoothly to localStorage.
 */
export async function syncToCloud(state: SyncState): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  saveLocalState(state);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guests stay entirely in localStorage. Besides avoiding unnecessary
    // requests, this prevents anonymous users from writing shared demo rows.
    if (!user) {
      return { success: true, cloudSynced: false, message: "Гостевой режим: сохранено локально" };
    }

    const { error } = await supabase.from("uniflow_profiles").upsert(
      {
        id: user.id,
        profile_data: state.profile,
        target_id: state.targetId,
        completed_tasks: state.completed,
        shortlist: state.shortlist,
        applications: state.applications,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      // If the migration has not been applied yet, the local copy is retained.
      return { success: true, cloudSynced: false, message: "Локально сохранено (Supabase таблица ещё не создана)" };
    }
    return { success: true, cloudSynced: true, message: "Синхронизировано с Supabase Cloud" };
  } catch (err) {
    return { success: true, cloudSynced: false, message: "Локальное сохранение активно" };
  }
}
