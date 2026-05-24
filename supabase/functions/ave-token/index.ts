import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AVE_API_BASE = "https://prod.ave-api.com/v2";
const CACHE = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000; // 30s cache to reduce API calls

const STUB_TOKENS: Record<string, Record<string, unknown>> = {
  BTC:  { symbol: "BTC",  name: "Bitcoin",           address: "0x0000000000000000000000000000000000000000", price: 68420, marketCap: 1_350_000_000_000, liquidity: 500_000_000, volume24h: 28_000_000_000, priceChange24h: 2.34, holders: 54_000_000, logoUrl: "https://cryptoicons.org/api/icon/btc/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 2.1, liquidityLocked: false, txCount24h: 350_000, riskScore: 15, inputType: "symbol", source: "stub" },
  ETH:  { symbol: "ETH",  name: "Ethereum",           address: "0x0000000000000000000000000000000000000000", price: 3520, marketCap: 423_000_000_000, liquidity: 350_000_000, volume24h: 15_000_000_000, priceChange24h: -1.23, holders: 120_000_000, logoUrl: "https://cryptoicons.org/api/icon/eth/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 1.8, liquidityLocked: false, txCount24h: 1_200_000, riskScore: 12, inputType: "symbol", source: "stub" },
  SOL:  { symbol: "SOL",  name: "Solana",             address: "0x0000000000000000000000000000000000000000", price: 148.5, marketCap: 66_000_000_000, liquidity: 120_000_000, volume24h: 4_500_000_000, priceChange24h: 5.67, holders: 15_000_000, logoUrl: "https://cryptoicons.org/api/icon/sol/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 3.2, liquidityLocked: false, txCount24h: 850_000, riskScore: 25, inputType: "symbol", source: "stub" },
  ARB:  { symbol: "ARB",  name: "Arbitrum",           address: "0x0000000000000000000000000000000000000000", price: 1.12, marketCap: 3_200_000_000, liquidity: 45_000_000, volume24h: 280_000_000, priceChange24h: -0.89, holders: 850_000, logoUrl: "https://cryptoicons.org/api/icon/arb/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 5.4, liquidityLocked: false, txCount24h: 420_000, riskScore: 28, inputType: "symbol", source: "stub" },
  PEPE: { symbol: "PEPE", name: "Pepe",               address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", price: 0.00000125, marketCap: 520_000_000, liquidity: 18_000_000, volume24h: 95_000_000, priceChange24h: 12.34, holders: 280_000, logoUrl: "https://cryptoicons.org/api/icon/pepe/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 8.7, liquidityLocked: false, txCount24h: 65_000, riskScore: 55, inputType: "symbol", source: "stub" },
  WLD:  { symbol: "WLD",  name: "Worldcoin",           address: "0x0000000000000000000000000000000000000000", price: 2.45, marketCap: 1_100_000_000, liquidity: 22_000_000, volume24h: 180_000_000, priceChange24h: -3.21, holders: 420_000, logoUrl: "https://cryptoicons.org/api/icon/wld/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 6.2, liquidityLocked: false, txCount24h: 95_000, riskScore: 40, inputType: "symbol", source: "stub" },
  AAVE: { symbol: "AAVE", name: "Aave",               address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", price: 105.80, marketCap: 1_580_000_000, liquidity: 55_000_000, volume24h: 210_000_000, priceChange24h: 1.45, holders: 180_000, logoUrl: "https://cryptoicons.org/api/icon/aave/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 4.8, liquidityLocked: false, txCount24h: 32_000, riskScore: 22, inputType: "symbol", source: "stub" },
  LINK: { symbol: "LINK", name: "Chainlink",           address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", price: 16.72, marketCap: 9_800_000_000, liquidity: 85_000_000, volume24h: 520_000_000, priceChange24h: -0.56, holders: 620_000, logoUrl: "https://cryptoicons.org/api/icon/link/200", chain: "eth", isMintable: false, isHoneypot: false, hasBlackMethod: false, topHolderPercent: 3.5, liquidityLocked: false, txCount24h: 78_000, riskScore: 18, inputType: "symbol", source: "stub" },
};

function isContractAddress(input: string): boolean {
  if (/^0x[a-fA-F0-9]{40}$/.test(input)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input) && !input.match(/^[A-Z]{2,10}$/)) return true;
  if (/^T[a-zA-Z0-9]{33}$/.test(input)) return true; // TRX
  return false;
}

function sanitizeInput(s: string): string {
  return s.replace(/[^a-zA-Z0-9._\-]/g, "").slice(0, 64);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const rawInput = url.searchParams.get("symbol") || url.searchParams.get("address") || "";
    const chain = url.searchParams.get("chain") || "";
    const input = sanitizeInput(rawInput);

    if (!input) {
      return new Response(
        JSON.stringify({ error: "symbol or address parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AVE_API_KEY = Deno.env.get("AVE_API_KEY");

    // Stub mode — return canned data for known symbols
    if (!AVE_API_KEY) {
      const match = STUB_TOKENS[rawInput.toUpperCase()];
      if (match) {
        const result = { ...match, riskScore: match.riskScore as number };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "Token not found in stub mode. Set AVE_API_KEY for live data." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = `${input}-${chain}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isContract = isContractAddress(rawInput);
    const aveUrl = `${AVE_API_BASE}/tokens?keyword=${encodeURIComponent(input)}${chain ? `&chain=${encodeURIComponent(chain)}` : ""}&limit=5`;

    // Retry with backoff to handle HTTP/2 connection errors
    let aveRes: Response | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        aveRes = await fetch(aveUrl, {
          headers: { "X-API-KEY": AVE_API_KEY, "Accept": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        break;
      } catch (err) {
        lastErr = err;
        console.error(`AVE API fetch attempt ${attempt + 1} failed:`, err);
        if (attempt < 2) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }

    if (!aveRes) {
      return new Response(
        JSON.stringify({ error: "Failed to reach AVE API after retries", details: String(lastErr) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!aveRes.ok) {
      const errText = await aveRes.text();
      console.error("AVE API error:", aveRes.status, errText);
      const isRateLimit = aveRes.status === 429;
      
      // For rate limits, return cached data if available, or a fallback-friendly response
      if (isRateLimit) {
        const cached = CACHE.get(cacheKey);
        if (cached) {
          return new Response(
            JSON.stringify(cached.data),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: "RATE_LIMITED", fallback: true, details: "Too many requests, please retry shortly" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AVE API returned ${aveRes.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aveData = await aveRes.json();
    const tokenArr = Array.isArray(aveData?.data) ? aveData.data : [];

    if (!tokenArr.length) {
      const label = isContract ? "contract address" : "symbol";
      return new Response(
        JSON.stringify({ error: `No token found for ${label} "${rawInput}"` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick best match
    const t = tokenArr.reduce((best: Record<string, unknown>, cur: Record<string, unknown>) => {
      const bestMcap = parseFloat(String(best.market_cap || best.fdv || "0"));
      const curMcap = parseFloat(String(cur.market_cap || cur.fdv || "0"));
      return curMcap > bestMcap ? cur : best;
    }, tokenArr[0]);

    const price = parseFloat(String(t.current_price_usd || t.price || "0"));
    const marketCap = parseFloat(String(t.market_cap || t.fdv || "0"));
    const liquidity = parseFloat(String(t.tvl || t.main_pair_tvl || t.liquidity || "0"));
    const volume24h = parseFloat(String(t.tx_volume_u_24h || t.volume_24h || "0"));
    const priceChange24h = parseFloat(String(t.price_change_24h || "0"));
    const holders = parseInt(String(t.holders || t.holder_count || "0"));
    const lockedPercent = parseFloat(String(t.locked_percent || "0"));
    const aveRiskScore = parseInt(String(t.risk_score || "0"));
    const txCount24h = parseInt(String(t.tx_count_24h || "0"));
    const priceHigh24h = parseFloat(String(t.price_high_24h || "0"));
    const priceLow24h = parseFloat(String(t.price_low_24h || "0"));

    const tokenData = {
      name: t.name || t.symbol || input,
      symbol: t.symbol || input.toUpperCase(),
      address: t.token || t.address || (isContract ? rawInput : ""),
      price,
      marketCap,
      liquidity,
      volume24h,
      priceChange24h,
      priceHigh24h,
      priceLow24h,
      holders,
      topHolderPercent: lockedPercent,
      liquidityLocked: lockedPercent > 0 || !!t.lock_platform,
      chain: t.chain || chain || "eth",
      txCount24h,
      lockPlatform: t.lock_platform || null,
      logoUrl: t.logo_url || null,
      aveRiskLevel: t.ave_risk_level ?? null,
      isMintable: t.is_mintable === "1",
      isHoneypot: t.is_honeypot === true || t.is_honeypot === "1",
      hasBlackMethod: t.has_black_method === true || t.has_black_method === "1",
      inputType: isContract ? "contract" : "symbol",
      source: "ave",
    };

    // Risk score calculation
    let riskScore = aveRiskScore;
    if (!riskScore || riskScore === 0) {
      riskScore = 50;
      if (liquidity > 1000000) riskScore -= 15;
      else if (liquidity < 10000) riskScore += 20;
      if (holders > 10000) riskScore -= 10;
      else if (holders < 100) riskScore += 15;
      if (!tokenData.liquidityLocked) riskScore += 15;
      if (marketCap > 0 && volume24h / marketCap > 0.5) riskScore -= 5;
      else if (marketCap > 0 && volume24h / marketCap < 0.01) riskScore += 10;
      if (tokenData.isMintable) riskScore += 10;
      if (tokenData.isHoneypot) riskScore += 30;
      if (tokenData.hasBlackMethod) riskScore += 15;
      riskScore = Math.max(5, Math.min(95, riskScore));
    }

    const result = { ...tokenData, riskScore };
    CACHE.set(cacheKey, { data: result, ts: Date.now() });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ave-token:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
