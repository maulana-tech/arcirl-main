# LeaderBond.sol — Deploy Proof

| Field | Value |
|---|---|
| **Contract** | `LeaderBond.sol` |
| **Network** | Arc Testnet |
| **Chain ID** | `5042002` |
| **Contract Address** | `0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea` |
| **Deployer** | `0x3a8d93D5F52a26689b075A49E67F4f8924BeC84B` |
| **Transaction Hash** | `0xd0317268824625f3b5e6485f937a2e626df74de8e8a44470e6b1ed4735ec333e` |
| **Explorer** | https://testnet.arcscan.app/tx/0xd0317268824625f3b5e6485f937a2e626df74de8e8a44470e6b1ed4735ec333e |
| **Date** | 2026-05-23 |
| **USDC (Arc native)** | `0x3600000000000000000000000000000000000000` |
| **Oracle** | `0x3a8d93D5F52a26689b075A49E67F4f8924BeC84B` |
| **Treasury** | `0x3a8d93D5F52a26689b075A49E67F4f8924BeC84B` |

## Deployment command

```bash
ARC_RPC_URL=https://rpc.testnet.arc.network \
  PRIVATE_KEY=*** \
  ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000 \
  ORACLE_ADDRESS=0x3a8d93D5F52a26689b075A49E67F4f8924BeC84B \
  TREASURY_ADDRESS=0x3a8d93D5F52a26689b075A49E67F4f8924BeC84B \
  forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

## Verification

View on Arcscan: https://testnet.arcscan.app/address/0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea
