import { useCallback, useEffect, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  price: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  priceHigh24h: number;
  priceLow24h: number;
  holders: number;
  topHolderPercent: number;
  liquidityLocked: boolean;
  chain: string;
  txCount24h: number;
  lockPlatform: string | null;
  logoUrl: string | null;
  aveRiskLevel: string | null;
  isMintable: boolean;
  isHoneypot: boolean;
  hasBlackMethod: boolean;
  inputType: "symbol" | "contract";
  riskScore: number;
}

export function useTokenInfo(query: string | undefined, chain?: string) {
  const [data, setData] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    if (!query) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const param = /^(0x|T|[1-9A-HJ-NP-Za-km-z]{32,})/.test(query) ? "address" : "symbol";
      const url = `${SUPABASE_URL}/functions/v1/ave-token?${param}=${encodeURIComponent(query)}${chain ? `&chain=${chain}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json as TokenInfo);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch token");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, chain]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  return { data, loading, error, refetch: fetchInfo };
}
