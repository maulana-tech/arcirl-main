// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {LeaderBond} from "../src/LeaderBond.sol";

/// @notice Deploy LeaderBond on Arc testnet.
///
/// Required env vars:
///   ARC_RPC_URL          — from ARC CLI output
///   PRIVATE_KEY          — deployer (must hold ETH/USDC for gas via Paymaster)
///   ARC_USDC_ADDRESS     — USDC token address on Arc (from Circle docs)
///   ORACLE_ADDRESS       — wallet that will call reportRank()
///                          (typically a Supabase edge function service account)
///   TREASURY_ADDRESS     — recipient of slashed funds
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
contract Deploy is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("ARC_USDC_ADDRESS");
        address oracle = vm.envAddress("ORACLE_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast(deployerPk);
        LeaderBond bond = new LeaderBond(usdc, oracle, treasury);
        vm.stopBroadcast();

        console2.log("LeaderBond deployed at:", address(bond));
        console2.log("USDC:    ", usdc);
        console2.log("Oracle:  ", oracle);
        console2.log("Treasury:", treasury);
    }
}
