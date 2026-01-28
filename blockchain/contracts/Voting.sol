// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    address public admin;

    struct Candidate {
        uint256 id;
        uint256 voteCount;
        bool exists;
    }

    struct Election {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        mapping(uint256 => Candidate) candidates;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Election) private elections;
    uint256 public electionCount;

    /* ---------- EVENTS ---------- */

    event ElectionCreated(
        uint256 indexed electionId,
        uint256 startTime,
        uint256 endTime
    );

    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId
    );

    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        address voter
    );

    /* ---------- MODIFIER ---------- */

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /* ---------- ADMIN ---------- */
    function createElection(
        uint256 startTime,
        uint256 endTime
    ) external onlyAdmin returns (uint256) {
        require(startTime > block.timestamp, "Start must be future");
        require(endTime > startTime, "End must be after start");

        electionCount++;
        Election storage e = elections[electionCount];
        e.id = electionCount;
        e.startTime = startTime;
        e.endTime = endTime;

        emit ElectionCreated(electionCount, startTime, endTime);
        return electionCount;
    }

    // 🔑 IMPORTANT: NO candidateId parameter
    function addCandidate(
        uint256 electionId
    ) external onlyAdmin returns (uint256) {
        require(electionId > 0 && electionId <= electionCount, "Invalid election");

        Election storage e = elections[electionId];
        require(block.timestamp < e.startTime, "Election started");

        e.candidateCount++;
        uint256 candidateId = e.candidateCount;

        e.candidates[candidateId] = Candidate({
            id: candidateId,
            voteCount: 0,
            exists: true
        });

        emit CandidateAdded(electionId, candidateId);
        return candidateId;
    }

    /* ---------- VOTING ---------- */

    function vote(
    uint256 electionId,
    uint256 candidateId
        ) external {
            require(
                electionId > 0 && electionId <= electionCount,
                "Invalid election"
            );

            Election storage e = elections[electionId];

            require(block.timestamp >= e.startTime, "Not started");
            require(block.timestamp <= e.endTime, "Ended");
            require(!e.hasVoted[msg.sender], "Already voted");
            require(e.candidates[candidateId].exists, "Invalid candidate");

            e.hasVoted[msg.sender] = true;
            e.candidates[candidateId].voteCount++;

            emit VoteCast(electionId, candidateId, msg.sender);
        }


    /* ---------- VIEW ---------- */

    function getResults(
        uint256 electionId
    )
        external
        view
        returns (uint256[] memory ids, uint256[] memory votes)
    {
        Election storage e = elections[electionId];
        uint256 count = e.candidateCount;

        ids = new uint256[](count);
        votes = new uint256[](count);

        for (uint256 i = 1; i <= count; i++) {
            ids[i - 1] = i;
            votes[i - 1] = e.candidates[i].voteCount;
        }
    }

    function candidateExists(
        uint256 electionId,
        uint256 candidateId
    ) external view returns (bool) {
        return elections[electionId].candidates[candidateId].exists;
    }


    function hasVoted(
        uint256 electionId,
        address user
    ) external view returns (bool) {
        return elections[electionId].hasVoted[user];
    }
}
