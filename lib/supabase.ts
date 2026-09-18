import { createClient } from "@supabase/supabase-js";
import type { StudentProfile, ShortlistItem, ApplicationItem } from "./types";

export const SUPABASE_URL = "https://hhtvbdxbfsvrgnpjfmag.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodHZiZHhiZnN2cmducGpmbWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzQzMjMsImV4cCI6MjEwNTMxMDMyM30.UBGw2Nmt97drKMcpEEEevfA7a10lbEsb4CB8gwFWh6Q";

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
    // Attempt upsert into uniflow_profiles table if configured
    const { error } = await supabase.from("uniflow_profiles").upsert(
      {
        id: state.profile?.name ? `profile_${encodeURIComponent(state.profile.name.toLowerCase().trim())}` : "demo_user",
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
      // Table doesn't exist yet or permission error, local state is securely saved
      return { success: true, cloudSynced: false, message: "Локально сохранено (Supabase таблица ещё не создана)" };
    }
    return { success: true, cloudSynced: true, message: "Синхронизировано с Supabase Cloud" };
  } catch (err) {
    return { success: true, cloudSynced: false, message: "Локальное сохранение активно" };
  }
}
