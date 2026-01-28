import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { BlockchainContext } from "../context/BlockChainContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function UserElectionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const election = location.state?.election;

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState(null);

  const { contract, account, changeAccount } =
    useContext(BlockchainContext);

  const token = localStorage.getItem("token");

  /* ==================== GUARDS ==================== */

  useEffect(() => {
    console.log("[INIT] Election from navigation state:", election);

    if (!election) {
      alert("Election data missing. Redirecting.");
      navigate("/elections");
    }
  }, [election, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    console.log("[FETCH] Loading candidates for election DB id:", id);

    fetch(`http://localhost:8000/elections/${id}/candidates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("[FETCH] Candidates from backend:", data);
        setCandidates(data);
      })
      .catch((err) => {
        console.error("[FETCH ERROR]", err);
      })
      .finally(() => setLoading(false));
  }, [id, token, navigate]);

  /* ==================== VOTE ==================== */

  const handleVote = async (candidate) => {
    console.group("🗳️ HANDLE VOTE");
    console.log("Candidate clicked:", candidate);
    console.log("Election:", election);
    console.log("Wallet:", account);

    if (!contract) {
      showToast("Connect wallet first");
      changeAccount(); // Or connectWallet() if available in context
      console.groupEnd();
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    // ⏱️ TIME CHECKS
    if (now < election.start_time) {
      alert("Election has not started yet");
      console.groupEnd();
      return;
    }

    if (now > election.end_time) {
      alert("Election has already ended");
      console.groupEnd();
      return;
    }

    // 🧍 CANDIDATE CHECK
    if (!candidate.candidate_id) {
      alert("Candidate not registered on blockchain");
      console.groupEnd();
      return;
    }

    try {
      // 🗳️ ALREADY VOTED?
      console.log("Checking if user already voted...");
      const alreadyVoted = await contract.hasVoted(
        election.blockchain_id,
        account
      );
      console.log("Already voted:", alreadyVoted);

      if (alreadyVoted) {
        alert("You have already voted in this election");
        console.groupEnd();
        return;
      }

      // 🧪 CANDIDATE EXISTS?
      console.log("Checking if candidate exists on-chain...");
      const exists = await contract.candidateExists(
        election.blockchain_id,
        candidate.candidate_id
      );
      console.log("Candidate exists:", exists);

      if (!exists) {
        alert("Candidate does not exist on blockchain");
        console.groupEnd();
        return;
      }

      // 🚀 SEND TX
      console.log("Sending vote transaction...");
      setVotingFor(candidate.candidate_id);

      // ✅ FIX: Force String conversion AND Manual Gas Limit
      const tx = await contract.vote(
        String(election.blockchain_id),
        String(candidate.candidate_id),
        {
          gasLimit: 500000, // Bypass estimateGas failure
        }
      );

      console.log("TX hash:", tx.hash);
      await tx.wait();
      console.log("TX confirmed");

      showToast(`Vote cast for ${candidate.name}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ VOTE FAILED", err);
      alert("Vote failed: " + (err.reason || err.message));
    } finally {
      setVotingFor(null);
      console.groupEnd();
    }
  };

  /* ==================== UI ==================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading ballot...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-gray-500 hover:text-blue-600"
        >
          ← Back to Elections
        </button>

        <div className="bg-white rounded-xl border p-6 mb-8">
          <h1 className="text-2xl font-bold">{election?.title}</h1>
          <p className="text-gray-500 mt-1">
            {election?.description || "No description"}
          </p>
          <div className="mt-2 text-xs text-gray-400 font-mono">
            Chain ID: #{election?.blockchain_id}
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4">
          Official Ballot ({candidates.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((c) => (
            <div
              key={c.candidate_id}
              className={`bg-white p-6 rounded-xl border ${
                votingFor === c.candidate_id
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-gray-200"
              }`}
            >
              <h3 className="text-xl font-bold">{c.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{c.party}</p>

              <button
                onClick={() => handleVote(c)}
                disabled={!!votingFor}
                className={`w-full py-3 rounded-lg font-bold ${
                  votingFor === c.candidate_id
                    ? "bg-blue-600 text-white"
                    : votingFor
                    ? "bg-gray-200 text-gray-400"
                    : "bg-black text-white hover:bg-blue-600"
                }`}
              >
                {votingFor === c.candidate_id ? "Confirming..." : "Vote"}
              </button>
            </div>
          ))}

          {candidates.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl border">
              No candidates available.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
