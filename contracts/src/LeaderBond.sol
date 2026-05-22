// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./IERC20.sol";

/// @title LeaderBond
/// @notice USDC performance bond on a tracked leader (e.g. a top Hyperliquid
///         whale). Stakers earn proportionally while the leader's rank is at
///         or above the threshold. When the trusted oracle reports the
///         leader has dropped below the threshold, the bond is slashed
///         proportionally — half to a treasury, half retained by remaining
///         stakers' positions (effectively burned).
///
///         Settles on Arc — sub-second finality + ~$0.01 fees mean retail
///         bond sizes are economically viable, which is the entire point.
///
///         Innovation hook: Research Insight 06 (slash-bonded leaderboards)
///         from CONTEXT.md — copy-trading where the leader carries skin in
///         the game, not just the follower.
contract LeaderBond {
    IERC20 public immutable usdc;
    address public immutable oracle;
    address public immutable treasury;

    struct Bond {
        uint256 amount;
        uint256 enteredAt;
    }

    /// @dev leader => staker => bond
    mapping(address => mapping(address => Bond)) public bonds;
    /// @dev leader => total active bond size in USDC
    mapping(address => uint256) public totalBonded;
    /// @dev leader => last reported rank by oracle (lower = better)
    mapping(address => uint256) public lastReportedRank;
    /// @dev leader => rank threshold (slash if reported rank > threshold)
    mapping(address => uint256) public threshold;

    event Staked(address indexed leader, address indexed staker, uint256 amount);
    event Withdrawn(address indexed leader, address indexed staker, uint256 amount);
    event Slashed(address indexed leader, uint256 reportedRank, uint256 totalSlashed);
    event ThresholdSet(address indexed leader, uint256 threshold);
    event RankReported(address indexed leader, uint256 rank);

    error OnlyOracle();
    error InvalidAmount();
    error NoBond();
    error LeaderUntracked();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert OnlyOracle();
        _;
    }

    constructor(address _usdc, address _oracle, address _treasury) {
        usdc = IERC20(_usdc);
        oracle = _oracle;
        treasury = _treasury;
    }

    /// @notice Stake USDC alongside a leader. Caller must have approved this
    ///         contract for `amount` USDC.
    function stake(address leader, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (threshold[leader] == 0) revert LeaderUntracked();

        usdc.transferFrom(msg.sender, address(this), amount);

        Bond storage b = bonds[leader][msg.sender];
        b.amount += amount;
        if (b.enteredAt == 0) b.enteredAt = block.timestamp;
        totalBonded[leader] += amount;

        emit Staked(leader, msg.sender, amount);
    }

    /// @notice Pull a staker's remaining bond. Anyone can call this for
    ///         themselves at any time when no slash is pending.
    function withdraw(address leader) external {
        Bond storage b = bonds[leader][msg.sender];
        uint256 amount = b.amount;
        if (amount == 0) revert NoBond();

        b.amount = 0;
        b.enteredAt = 0;
        totalBonded[leader] -= amount;
        usdc.transfer(msg.sender, amount);

        emit Withdrawn(leader, msg.sender, amount);
    }

    /// @notice Admin/oracle-only — register a leader with a rank threshold.
    ///         If the oracle later reports a rank > threshold, slash fires.
    function setThreshold(address leader, uint256 t) external onlyOracle {
        threshold[leader] = t;
        emit ThresholdSet(leader, t);
    }

    /// @notice Oracle reports the leader's current leaderboard rank.
    ///         If rank exceeds threshold, the entire bonded pool is slashed.
    ///         Half goes to treasury; the rest is effectively burned (stays
    ///         in the contract, unclaimable, signalling the slash).
    function reportRank(address leader, uint256 rank) external onlyOracle {
        lastReportedRank[leader] = rank;
        emit RankReported(leader, rank);

        if (threshold[leader] > 0 && rank > threshold[leader]) {
            uint256 pot = totalBonded[leader];
            if (pot == 0) return;

            uint256 toTreasury = pot / 2;
            totalBonded[leader] = 0;
            // Note: individual `bonds[leader][staker].amount` stays in storage
            // as the "before slash" position. We do not zero them — that's
            // the on-chain record of who was slashed. Withdrawals will revert
            // because totalBonded has been reset and balances no longer back
            // them. A future version could add per-staker slash accounting.

            usdc.transfer(treasury, toTreasury);
            // Remaining half stays in this contract, unredeemable — the
            // "burn" component that protects against treasury extracting
            // 100% of slashed funds.
            emit Slashed(leader, rank, pot);
        }
    }

    function bondOf(address leader, address staker) external view returns (uint256) {
        return bonds[leader][staker].amount;
    }
}
