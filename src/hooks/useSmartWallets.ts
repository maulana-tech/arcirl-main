import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type WalletVenue = "hyperliquid" | "polymarket" | "onchain";

export interface SmartWalletRow {
  id: string;
  user_id: string;
  address: string;
  label: string | null;
  chain: string | null;
  venue: WalletVenue;
  notifications_on: boolean | null;
  created_at: string;
}

export function useSmartWallets(venue?: WalletVenue) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<SmartWalletRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("tracked_wallets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (venue) query = query.eq("venue", venue);
    const { data } = await query;
    setWallets((data as SmartWalletRow[]) || []);
    setLoading(false);
  }, [user, venue]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const addWallet = useCallback(
    async (input: { address: string; label?: string; chain?: string; venue: WalletVenue }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("tracked_wallets").insert({
        user_id: user.id,
        address: input.address,
        label: input.label ?? `Wallet ${wallets.length + 1}`,
        chain: input.chain ?? null,
        venue: input.venue,
      });
      if (error) throw error;
      await fetchWallets();
    },
    [user, wallets.length, fetchWallets],
  );

  const removeWallet = useCallback(
    async (id: string) => {
      await supabase.from("tracked_wallets").delete().eq("id", id);
      await fetchWallets();
    },
    [fetchWallets],
  );

  const toggleNotifications = useCallback(
    async (id: string, current: boolean) => {
      await supabase.from("tracked_wallets").update({ notifications_on: !current }).eq("id", id);
      await fetchWallets();
    },
    [fetchWallets],
  );

  return { wallets, loading, refetch: fetchWallets, addWallet, removeWallet, toggleNotifications };
}

// ─── Top traders fetchers (per venue) ──────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface TopHLTrader {
  address: `0x${string}`;
  accountValue: number;
  pnl: number;
}

export async function fetchTopHLTraders(limit = 25): Promise<TopHLTrader[]> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/hyperliquid-fetch?action=leaderboard&limit=${limit}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.traders ?? [];
}

export interface TopPMTrader {
  address: string;
  username: string | null;
  pnlUsdc: number;
  volumeUsdc: number;
  positions: number;
}

export async function fetchTopPMTraders(limit = 25): Promise<TopPMTrader[]> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/polymarket-traders?action=top-traders&limit=${limit}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.traders ?? [];
}
