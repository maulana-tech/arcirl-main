import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { ethers } from "https://esm.sh/ethers@6.13.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ARC_RPC = Deno.env.get("ARC_RPC_URL") || "https://rpc.testnet.arc.network";
const LEADER_BOND_ADDRESS = Deno.env.get("LEADER_BOND_ADDRESS") || "";

const LEADER_BOND_ABI = [
  "function reportRank(address leader, uint256 rank) external",
  "function setThreshold(address leader, uint256 threshold) external",
  "function lastReportedRank(address) view returns (uint256)",
  "function threshold(address) view returns (uint256)",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!LEADER_BOND_ADDRESS) {
    return json({
      is_stub: true,
      message: "LEADER_BOND_ADDRESS not configured — set env var in Supabase secrets",
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "report-rank";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    switch (action) {
      case "report-rank": {
        const { leader, rank } = body;
        if (!leader || rank === undefined) {
          return json({ error: "leader address and rank required" }, 400);
        }

        const threshold = body.threshold;

        const provider = new ethers.JsonRpcProvider(ARC_RPC);
        const oracleKey = Deno.env.get("ORACLE_PRIVATE_KEY");
        if (!oracleKey) {
          return json({ error: "ORACLE_PRIVATE_KEY not configured" }, 500);
        }
        const wallet = new ethers.Wallet(oracleKey, provider);
        const contract = new ethers.Contract(LEADER_BOND_ADDRESS, LEADER_BOND_ABI, wallet);

        if (threshold) {
          const tx = await contract.setThreshold(leader, threshold);
          await tx.wait();
        }

        const tx = await contract.reportRank(leader, rank);
        const receipt = await tx.wait();

        const { error: dbErr } = await supabase.from("rank_reports").insert({
          leader,
          rank,
          threshold: threshold ?? null,
          tx_hash: receipt.hash,
          chain: "arc_testnet",
        });
        if (dbErr) console.error("DB insert failed:", dbErr);

        return json({
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
        });
      }

      case "get-rank": {
        const { leader } = body;
        if (!leader) return json({ error: "leader address required" }, 400);

        const provider = new ethers.JsonRpcProvider(ARC_RPC);
        const contract = new ethers.Contract(LEADER_BOND_ADDRESS, LEADER_BOND_ABI, provider);

        const [currentRank, currentThreshold] = await Promise.all([
          contract.lastReportedRank(leader),
          contract.threshold(leader),
        ]);

        return json({
          leader,
          rank: Number(currentRank),
          threshold: Number(currentThreshold),
        });
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
