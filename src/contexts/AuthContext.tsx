import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createEmbeddedWallet } from "@/lib/circle";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  circleWallet: { id: string; address: string } | null;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [circleWallet, setCircleWallet] = useState<{ id: string; address: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    let sub: ReturnType<typeof supabase.auth.onAuthStateChange>[0] | null = null;
    
    const setup = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => checkAdmin(session.user.id), 0);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        });
        sub = data.subscription;

        const { data: sessionData } = await supabase.auth.getSession();
        if (mounted) {
          setSession(sessionData.session);
          setUser(sessionData.session?.user ?? null);
          if (sessionData.session?.user) {
            checkAdmin(sessionData.session.user.id);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    setup();
    return () => { mounted = false; sub?.unsubscribe(); };
  }, []);

  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username || "Trader" },
        emailRedirectTo: window.location.origin,
      },
    });
    if (!error) {
      const uid = data.user?.id;
      if (uid) {
        createEmbeddedWallet(uid).then((wallet) => {
          setCircleWallet({ id: wallet.id, address: wallet.address });
        }).catch(() => {});
      }
    }
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, circleWallet, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
