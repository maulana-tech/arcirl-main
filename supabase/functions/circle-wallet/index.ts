import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CIRCLE_API_KEY = Deno.env.get("CIRCLE_API_KEY");
const CIRCLE_BASE = "https://api.circle.com/v1/w3s";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function circleFetch(path: string, options: RequestInit = {}) {
  if (!CIRCLE_API_KEY) throw new Error("CIRCLE_API_KEY not configured");
  return fetch(`${CIRCLE_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CIRCLE_API_KEY}`,
      ...options.headers,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "create-wallet";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const hasApiKey = Boolean(CIRCLE_API_KEY);

    switch (action) {
      case "create-wallet": {
        const { userId } = body;
        if (!userId) throw new Error("userId required");

        const existing = await supabase
          .from("circle_wallets")
          .select("wallet_id, address, blockchain")
          .eq("user_id", userId)
          .maybeSingle();
        if (existing.data) {
          return json({
            wallet: {
              id: existing.data.wallet_id,
              address: existing.data.address,
              blockchain: existing.data.blockchain,
              state: "LIVE",
            },
          });
        }

        if (!hasApiKey) {
          const stubWallet = {
            id: `stub-${crypto.randomUUID().slice(0, 8)}`,
            address: `0xStub${userId.slice(0, 36).padEnd(40, "0")}` as const,
            blockchain: "ARB-ETH",
            state: "LIVE" as const,
          };
          await supabase.from("circle_wallets").insert({
            user_id: userId,
            wallet_id: stubWallet.id,
            address: stubWallet.address,
            blockchain: stubWallet.blockchain,
            wallet_set_id: null,
            state: "LIVE",
          });
          return json({ wallet: stubWallet });
        }

        const walletRes = await circleFetch("/developer/wallets", {
          method: "POST",
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            blockchains: ["ARB-ETH"],
            count: 1,
          }),
        });
        if (!walletRes.ok) {
          const err = await walletRes.text();
          return json({ error: `Wallet creation failed: ${err}` }, 500);
        }
        const walletData = await walletRes.json();
        const wallet = walletData.data?.wallets?.[0];
        if (!wallet) throw new Error("No wallet returned from Circle");

        await supabase.from("circle_wallets").insert({
          user_id: userId,
          wallet_id: wallet.id,
          address: wallet.address,
          blockchain: wallet.blockchain || "ARB-ETH",
          wallet_set_id: wallet.walletSetId ?? null,
          state: wallet.state || "LIVE",
        });

        return json({
          wallet: {
            id: wallet.id,
            address: wallet.address,
            blockchain: wallet.blockchain || "ARB-ETH",
            state: wallet.state || "LIVE",
          },
        });
      }

      case "get-wallet": {
        const { userId } = body;
        if (!userId) throw new Error("userId required");
        const { data } = await supabase
          .from("circle_wallets")
          .select("wallet_id, address, blockchain, state")
          .eq("user_id", userId)
          .maybeSingle();
        if (!data) return json({ wallet: null });
        return json({
          wallet: {
            id: data.wallet_id,
            address: data.address,
            blockchain: data.blockchain,
            state: data.state,
          },
        });
      }

      case "get-balance": {
        const { walletId } = body;
        if (!walletId) throw new Error("walletId required");
        if (!hasApiKey) {
          return json({ balances: [{ token: { symbol: "USDC" }, amount: "0", blockchain: "ARB-ETH" }] });
        }
        const balRes = await circleFetch(`/developer/wallets/${walletId}/balances`);
        if (!balRes.ok) {
          const err = await balRes.text();
          return json({ error: `Balance fetch failed: ${err}` }, 500);
        }
        const balData = await balRes.json();
        return json({ balances: balData.data?.tokenBalances ?? [] });
      }

      case "quote-paymaster": {
        const { walletAddress, to, data: txData, value } = body;
        if (!walletAddress || !to || !txData) throw new Error("walletAddress, to, data required");
        if (!hasApiKey) {
          return json({
            quote: { feeAmountUsdc: "0.01", expiresAt: Date.now() + 300_000, id: "stub-quote" },
          });
        }
        const pmRes = await circleFetch("/paymaster/quote", {
          method: "POST",
          body: JSON.stringify({
            walletAddress,
            to,
            data: txData,
            value: value || "0",
            feeToken: "USDC",
          }),
        });
        if (!pmRes.ok) {
          const err = await pmRes.text();
          return json({ error: `Paymaster quote failed: ${err}` }, 500);
        }
        const pmData = await pmRes.json();
        return json({ quote: pmData.data });
      }

      case "send-sponsored-tx": {
        const { walletAddress, to, data: txData, value, quoteId } = body;
        if (!walletAddress || !to || !txData || !quoteId) {
          throw new Error("walletAddress, to, data, quoteId required");
        }
        if (!hasApiKey) {
          return json({
            tx: { txHash: `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 64)}` },
          });
        }
        const txRes = await circleFetch("/paymaster/transaction", {
          method: "POST",
          body: JSON.stringify({
            walletAddress,
            to,
            data: txData,
            value: value || "0",
            quoteId,
          }),
        });
        if (!txRes.ok) {
          const err = await txRes.text();
          return json({ error: `Sponsored tx failed: ${err}` }, 500);
        }
        const txData_res = await txRes.json();
        return json({ tx: txData_res.data });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
