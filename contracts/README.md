# Contracts

Solidity contracts for the Visco AI Smart Money Copy Agent — deployed to Arc.

## LeaderBond.sol

USDC performance bond on a tracked Hyperliquid whale. Stakers earn alongside the leader's rank; when the oracle reports the leader dropping below threshold, the bond is slashed (half to treasury, half effectively burned).

Realizes [Research Insight 06](../CONTEXT.md) — copy-trading with skin in the game on the leader, not just the follower.

## Setup

Install [Foundry](https://book.getfoundry.sh/):

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Install `forge-std`:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
```

## Deploy to Arc testnet

Set env vars (Arc chain config from ARC CLI):

```bash
export ARC_RPC_URL=https://arc-node.thecanteenapp.com/
export PRIVATE_KEY=0x...
export ARC_USDC_ADDRESS=0x...           # from Circle docs / Arc explorer
export ORACLE_ADDRESS=0x...             # service account that posts ranks
export TREASURY_ADDRESS=0x...           # slashed-funds recipient
```

Deploy:

```bash
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

## Oracle integration

Once deployed, the `oracle-leaderboard-rank` Supabase edge function (Phase 5) needs:

- `LEADERBOND_ADDRESS` — deployed contract address (from `forge script` output)
- `ARC_RPC_URL` — same as above
- `ORACLE_PRIVATE_KEY` — must match `ORACLE_ADDRESS` in deployment

The function polls Nansen HL leaderboard every 30 minutes and calls `reportRank(leader, currentRank)` on the contract for each tracked leader. If rank exceeds threshold, the contract auto-slashes.
