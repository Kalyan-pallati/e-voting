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

  // Form States
  const [addMode, setAddMode] = useState("existing"); // 'existing' | 'new'
  const [selectedPoliticianId, setSelectedPoliticianId] = useState("");
  const [newName, setNewName] = useState("");
  const [newParty, setNewParty] = useState("");
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

  /* ---------------- HELPERS ---------------- */

  const getElectionStatus = (e) => {
    if (!e) return "draft";
    const now = Date.now() / 1000;
    if (now < e.start_time) return "draft";
    if (now > e.end_time) return "closed";
    return "active";
  };

  /* ---------------- ACTIONS ---------------- */

  // Core Logic: Add a politician (object) to the current selected election
  const executeBlockchainAdd = async (politician) => {
    if (!contract) throw new Error("Connect wallet first");
    if (!selectedElection) throw new Error("No election selected");

    console.log(
      `Adding ${politician.name} to Election #${selectedElection.blockchain_id}...`
    );

    // 1️⃣ Blockchain Write
    const tx = await contract.addCandidate(selectedElection.blockchain_id);
    const receipt = await tx.wait();

    // 2️⃣ Read Event
    const event = receipt.logs.find(
      (l) => l.fragment?.name === "CandidateAdded"
    );
    if (!event) throw new Error("CandidateAdded event not found in logs");

    const newCandidateId = Number(event.args[1]);

    // 3️⃣ Backend Sync
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
          candidate_id: newCandidateId,
        }),
      }
    );

    if (!res.ok) throw new Error("Failed to sync with database");
    return newCandidateId;
  };

  // HANDLER: Add from Existing Dropdown
  const handleAddExisting = async () => {
    if (!selectedPoliticianId) return alert("Select a politician");
    const politician = globalPoliticians.find(
      (p) => p.id === selectedPoliticianId
    );
    if (!politician) return;

    setLoading(true);
    try {
      await executeBlockchainAdd(politician);
      alert(`${politician.name} added successfully!`);
      setSelectedPoliticianId("");
      fetchLinkedCandidates(selectedElection);
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // HANDLER: Create New & Add Immediately
  const handleCreateAndAdd = async () => {
    if (!newName.trim() || !newParty.trim())
      return alert("Enter name and party");

    setLoading(true);
    try {
      // 1. Create in Global Bank first
      const createRes = await fetch("http://localhost:8000/admin/politicians", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName, party: newParty }),
      });

      if (!createRes.ok) throw new Error("Failed to create global politician");
      const { id } = await createRes.json();

      // 2. Refresh bank and get the full object
      await fetchGlobalPoliticians(); // Update local list
      const newPolitician = { id, name: newName, party: newParty };

      // 3. Add to Election
      await executeBlockchainAdd(newPolitician);

      alert(`${newName} created and added to ballot!`);
      setNewName("");
      setNewParty("");
      fetchLinkedCandidates(selectedElection);
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  const currentStatus = getElectionStatus(selectedElection);
  const isEditable = currentStatus === "draft";

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Election List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800">Select Election</h2>
            <button
              onClick={() => navigate("/admin/elections")}
              className="text-sm text-blue-600 hover:underline"
            >
              Manage Elections &rarr;
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[80vh] overflow-y-auto">
            {elections.map((e) => {
              const status = getElectionStatus(e);
              const isSelected = selectedElection?.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => fetchLinkedCandidates(e)}
                  className={`p-4 text-left border-b border-gray-50 transition-all hover:bg-gray-50
                    ${isSelected ? "bg-blue-50/60 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}
                  `}
                >
                  <div className="font-bold text-gray-900 truncate">
                    {e.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                      ${
                        status === "active"
                          ? "bg-green-100 text-green-700"
                          : status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                    >
                      {status}
                    </span>
                    <span className="text-xs text-gray-400">
                      #{e.blockchain_id}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Details & Management */}
        <div className="lg:col-span-8 space-y-6">
          {selectedElection ? (
            <>
              {/* Header */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {selectedElection.title}
                    </h1>
                    <p className="text-gray-500 mt-1">
                      {selectedElection.description || "No description provided."}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Status
                    </div>
                    {isEditable ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                        Draft Mode
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600">
                        {currentStatus === "active" ? "Live (Locked)" : "Ended (Locked)"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Candidate Section (Only visible if Draft) */}
              {isEditable ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="bg-gray-50/50 p-2 flex gap-2 border-b border-gray-100">
                    <button
                      onClick={() => setAddMode("existing")}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        addMode === "existing"
                          ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Select Existing
                    </button>
                    <button
                      onClick={() => setAddMode("new")}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        addMode === "new"
                          ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Create New
                    </button>
                  </div>

                  <div className="p-6">
                    {addMode === "existing" ? (
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 appearance-none"
                            value={selectedPoliticianId}
                            onChange={(e) => setSelectedPoliticianId(e.target.value)}
                          >
                            <option value="">Choose from Global Bank...</option>
                            {globalPoliticians.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.party}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                        <button
                          onClick={handleAddExisting}
                          disabled={loading}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all active:scale-95"
                        >
                          {loading ? "Adding..." : "Add to Ballot"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Name</label>
                          <input
                            placeholder="Candidate Name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Party</label>
                          <input
                            placeholder="Party Affiliation"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newParty}
                            onChange={(e) => setNewParty(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={handleCreateAndAdd}
                          disabled={loading}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 disabled:opacity-50 transition-all active:scale-95 mb-[1px]"
                        >
                          {loading ? "Creating..." : "Create & Add"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    This election is <strong>{currentStatus}</strong>. The ballot is locked and candidates cannot be modified.
                  </span>
                </div>
              )}

              {/* Ballot List */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Official Ballot</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                    {linkedCandidates.length} Candidates
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {linkedCandidates.map((c, index) => (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-sm border border-gray-200">
                          #{c.candidate_id}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            {c.party}
                          </div>
                        </div>
                      </div>
                      {/* Placeholder for future actions like 'Remove' if needed (Logic not implemented) */}
                    </div>
                  ))}
                  {linkedCandidates.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-sm">
                      No candidates added yet. Use the form above to add one.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Empty State (No Election Selected)
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed p-12">
              <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No Election Selected</h3>
              <p className="mt-1 max-w-xs text-center">
                Select an election from the sidebar to manage its candidates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}