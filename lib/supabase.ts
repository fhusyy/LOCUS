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

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

export function loadLocalState(userId?: string | null): SyncState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load local state:", err);
    return {};
  }
}

export function saveLocalState(state: SyncState, userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify({ ...state, lastSyncedAt: new Date().toISOString() }));
  } catch (err) {
    console.warn("Failed to save local state:", err);
  }
}

export async function loadAccountState(userId: string): Promise<SyncState> {
  const local = loadLocalState(userId);
  try {
    const { data, error } = await supabase
      .from("uniflow_profiles")
      .select("profile_data,target_id,completed_tasks,shortlist,applications,updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return local;

    const cloudState: SyncState = {
      profile: data.profile_data as StudentProfile | undefined,
      targetId: data.target_id ?? undefined,
      completed: Array.isArray(data.completed_tasks) ? data.completed_tasks : [],
      shortlist: Array.isArray(data.shortlist) ? data.shortlist as ShortlistItem[] : [],
      applications: Array.isArray(data.applications) ? data.applications as ApplicationItem[] : [],
      lastSyncedAt: data.updated_at ?? undefined,
    };
    saveLocalState(cloudState, userId);
    return cloudState;
  } catch (err) {
    console.warn("Failed to load account state:", err);
    return local;
  }
}

/**
 * Graceful cloud synchronization with Supabase.
 * Tries cloud tables first; if tables don't exist yet, falls back smoothly to localStorage.
 */
export async function syncToCloud(state: SyncState): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guests stay entirely in localStorage. Besides avoiding unnecessary
    // requests, this prevents anonymous users from writing shared demo rows.
    if (!user) {
      return { success: false, cloudSynced: false, message: "Войдите, чтобы сохранить маршрут" };
    }

    saveLocalState(state, user.id);

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
