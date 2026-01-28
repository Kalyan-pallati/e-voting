import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BlockchainContext } from "../context/BlockChainContext.jsx";

export default function AdminCandidates() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const { contract } = useContext(BlockchainContext);

  const preSelectedElection = location.state?.election || null;

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(preSelectedElection);
  const [globalPoliticians, setGlobalPoliticians] = useState([]);
  const [linkedCandidates, setLinkedCandidates] = useState([]);

  const [selectedPoliticianId, setSelectedPoliticianId] = useState("");
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchElections();
    fetchGlobalPoliticians();
    if (preSelectedElection) fetchLinkedCandidates(preSelectedElection);
  }, []);

  /* ---------------- FETCHERS ---------------- */

  const fetchElections = async () => {
    const res = await fetch("http://localhost:8000/admin/elections", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setElections(await res.json());
  };

  const fetchGlobalPoliticians = async () => {
    const res = await fetch("http://localhost:8000/admin/politicians", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setGlobalPoliticians(await res.json());
  };

  const fetchLinkedCandidates = async (election) => {
    setSelectedElection(election);
    const res = await fetch(
      `http://localhost:8000/elections/${election.id}/candidates`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setLinkedCandidates(res.ok ? await res.json() : []);
  };

  /* ---------------- ACTIONS ---------------- */

  // DB ONLY
  const createGlobalPolitician = async () => {
    if (!name.trim() || !party.trim()) {
      alert("Enter name and party");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/admin/politicians", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, party }),
      });

      if (!res.ok) throw new Error("Failed to create politician");

      setName("");
      setParty("");
      fetchGlobalPoliticians();
      alert("Politician saved in database");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // BLOCKCHAIN + DB SAVE (MATCHES BACKEND)
  const addToElection = async () => {
    if (!contract) return alert("Connect wallet");
    if (!selectedElection) return alert("Select election");
    if (!selectedPoliticianId) return alert("Select politician");

    const politician = globalPoliticians.find((p) => p.id === selectedPoliticianId);
    if (!politician) return;

    setLoading(true);
    try {
      console.log(`Adding ${politician.name} to Election #${selectedElection.blockchain_id}...`);

      // 1️⃣ Blockchain: Only send Election ID (Contract generates Candidate ID)
      const tx = await contract.addCandidate(selectedElection.blockchain_id);
      const receipt = await tx.wait();

      // ✅ CRITICAL: Read the "CandidateAdded" event to get the new ID
      const event = receipt.logs.find((l) => l.fragment?.name === "CandidateAdded");
      if (!event) throw new Error("CandidateAdded event not found in logs");
      
      const newCandidateId = Number(event.args[1]); // args[0]=electionId, args[1]=candidateId
      console.log("Blockchain assigned Candidate ID:", newCandidateId);

      // 2️⃣ Backend: Save using the ID we got from Blockchain
      const res = await fetch(
        `http://localhost:8000/elections/${selectedElection.id}/candidates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: politician.name,
            party: politician.party,
            candidate_id: newCandidateId, // Sync perfectly with chain
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save candidate to DB");

      setSelectedPoliticianId("");
      fetchLinkedCandidates(selectedElection);
      alert(`${politician.name} added to election`);
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };
  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <h1 className="text-2xl font-bold">Manage Candidates</h1>

        {/* ELECTION LIST */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 font-bold text-gray-700">Elections</div>
          {elections.map((e) => (
            <button
              key={e.id}
              onClick={() => fetchLinkedCandidates(e)}
              className={`w-full px-4 py-3 text-left border-t ${
                selectedElection?.id === e.id
                  ? "bg-blue-50 font-semibold"
                  : "hover:bg-gray-50"
              }`}
            >
              {e.title}
            </button>
          ))}
        </div>

        {/* GLOBAL POLITICIANS */}
        <div className="bg-white p-6 rounded-xl border">
          <h2 className="font-bold mb-4">Global Candidate Bank</h2>
          <div className="flex gap-3">
            <input
              placeholder="Name"
              className="border px-3 py-2 rounded w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Party"
              className="border px-3 py-2 rounded w-full"
              value={party}
              onChange={(e) => setParty(e.target.value)}
            />
            <button
              onClick={createGlobalPolitician}
              disabled={loading}
              className="bg-black text-white px-4 rounded"
            >
              Create
            </button>
          </div>
        </div>

        {/* ADD TO ELECTION */}
        {selectedElection && (
          <div className="bg-white p-6 rounded-xl border space-y-4">
            <h2 className="font-bold">
              Add to {selectedElection.title}
            </h2>

            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedPoliticianId}
              onChange={(e) => setSelectedPoliticianId(e.target.value)}
            >
              <option value="">Select candidate</option>
              {globalPoliticians.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.party})
                </option>
              ))}
            </select>

            <button
              onClick={addToElection}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded"
            >
              Add to Blockchain
            </button>
          </div>
        )}

        {/* LINKED CANDIDATES */}
        {selectedElection && (
          <div className="bg-white rounded-xl border">
            <div className="p-4 font-bold">Ballot</div>
            {linkedCandidates.map((c) => (
              <div key={c.id} className="px-4 py-2 border-t">
                #{c.candidate_id} — {c.name} ({c.party})
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
