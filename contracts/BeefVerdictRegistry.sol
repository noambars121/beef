// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BEEF Verdict Registry
/// @notice Permanent on-chain court record for BEEF (sendbeef.vercel.app).
///         Every AI verdict is sealed on Monad: case key, docket number,
///         winner, weighted scores and an integrity hash of the ruling text.
///         Appeals that overturn a ruling flip the winner on-chain too.
/// @dev    The app's server wallet (the "judge") is the only writer. Reads
///         are open to everyone — any juror can verify a ruling was never
///         quietly edited after the fact.
contract BeefVerdictRegistry {
    enum Ruling {
        None,
        SideA,
        SideB
    }

    struct VerdictRecord {
        uint32 docketNo;
        Ruling winner;
        uint8 scoreA; // weighted judge score 0-30 (logic*2 + evidence)
        uint8 scoreB;
        bytes32 verdictHash; // keccak256(short_verdict | roast_line)
        uint64 sealedAt;
        bool overturnedOnAppeal;
    }

    address public immutable judge;
    uint256 public totalVerdicts;
    uint256 public totalOverturned;
    mapping(bytes32 caseKey => VerdictRecord) private _verdicts;

    event VerdictSealed(
        bytes32 indexed caseKey,
        uint32 indexed docketNo,
        Ruling winner,
        uint8 scoreA,
        uint8 scoreB,
        bytes32 verdictHash
    );

    event VerdictOverturned(bytes32 indexed caseKey, Ruling newWinner);

    error OnlyJudge();
    error AlreadySealed();
    error NotSealed();
    error InvalidRuling();

    constructor() {
        judge = msg.sender;
    }

    modifier onlyJudge() {
        if (msg.sender != judge) revert OnlyJudge();
        _;
    }

    /// @notice Seal a delivered verdict. One record per case, forever.
    /// @param caseKey keccak256 of the app-side case id.
    function sealVerdict(
        bytes32 caseKey,
        uint32 docketNo,
        Ruling winner,
        uint8 scoreA,
        uint8 scoreB,
        bytes32 verdictHash
    ) external onlyJudge {
        if (winner == Ruling.None) revert InvalidRuling();
        if (_verdicts[caseKey].sealedAt != 0) revert AlreadySealed();

        _verdicts[caseKey] = VerdictRecord({
            docketNo: docketNo,
            winner: winner,
            scoreA: scoreA,
            scoreB: scoreB,
            verdictHash: verdictHash,
            sealedAt: uint64(block.timestamp),
            overturnedOnAppeal: false
        });
        unchecked {
            totalVerdicts++;
        }

        emit VerdictSealed(caseKey, docketNo, winner, scoreA, scoreB, verdictHash);
    }

    /// @notice The appellate court overturned the ruling — flip the winner.
    function overturnVerdict(bytes32 caseKey) external onlyJudge {
        VerdictRecord storage rec = _verdicts[caseKey];
        if (rec.sealedAt == 0) revert NotSealed();
        if (rec.overturnedOnAppeal) revert AlreadySealed();

        rec.overturnedOnAppeal = true;
        rec.winner = rec.winner == Ruling.SideA ? Ruling.SideB : Ruling.SideA;
        unchecked {
            totalOverturned++;
        }

        emit VerdictOverturned(caseKey, rec.winner);
    }

    function getVerdict(
        bytes32 caseKey
    ) external view returns (VerdictRecord memory) {
        return _verdicts[caseKey];
    }

    function isSealed(bytes32 caseKey) external view returns (bool) {
        return _verdicts[caseKey].sealedAt != 0;
    }
}
