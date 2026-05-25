import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function getSessionId() {
  let sid = sessionStorage.getItem("cn-visitor-sid");
  if (!sid) {
    sid = "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("cn-visitor-sid", sid);
  }
  return sid;
}

export function useVisitorTracking() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const sessionId = getSessionId();

    // Insert or update visitor session
    const track = async () => {
      try {
        // Simple insert-only approach — no SELECT needed (avoid RLS 403)
        // Use upsert with on_conflict handling if session_id has unique constraint
        await supabase
          .from("visitor_sessions")
          .insert(
            { session_id: sessionId, last_active: new Date().toISOString() },
            { onConflict: "session_id" }
          );
      } catch {
        // Silent fail for visitor tracking
      }
    };

    track();
  }, []);

  return { sessionId: getSessionId() };
}
