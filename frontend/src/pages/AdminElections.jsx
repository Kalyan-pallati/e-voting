import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { BlockchainContext } from "../context/BlockChainContext.jsx";

export default function AdminElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'draft' | 'active' | 'closed'

  // tx status: idle | wallet | mining | success
  const [txStatus, setTxStatus] = useState("idle");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { contract } = useContext(BlockchainContext);

  useEffect(() => {
    if (!token) navigate("/login");
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await fetch("http://localhost:8000/admin/elections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setElections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- HELPERS -------------------- */

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
            DRAFT
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            ENDED
          </span>
        );
      default:
        return null;
    }
  };

  const filteredElections = elections.filter((e) => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  /* -------------------- CREATE -------------------- */

  const createElection = async () => {
    if (!title || !startTime || !endTime) return alert("Fill all fields");
    if (!contract) return alert("Connect wallet first");

    try {
      setTxStatus("wallet");

      const startSeconds = Math.floor(new Date(startTime).getTime() / 1000);
      const endSeconds = Math.floor(new Date(endTime).getTime() / 1000);

      if (endSeconds <= startSeconds) {
        alert("End time must be after start time");
        setTxStatus("idle");
        return;
      }

      console.log("Creating election ON-CHAIN...");

      // Only send time (Contract doesn't need Title)
      const tx = await contract.createElection(startSeconds, endSeconds);

      setTxStatus("mining");
      const receipt = await tx.wait();

      // Get the ID from the event log
      const event = receipt.logs.find(
        (l) => l.fragment?.name === "ElectionCreated"
      );
      const blockchainId = event ? Number(event.args[0]) : null;

      if (!blockchainId)
        throw new Error("Failed to get Election ID from chain");

      console.log("Election created:", blockchainId);

      // DB write
      const res = await fetch("http://localhost:8000/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title, // Saved to DB
          description,
          start_time: startSeconds,
          end_time: endSeconds,
          blockchain_id: blockchainId,
        }),
      });

      if (!res.ok) throw new Error("DB insert failed");

      setTxStatus("success");
      setTimeout(() => {
        setShowModal(false);
        setTxStatus("idle");
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        fetchElections();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + (err.reason || err.message));
      setTxStatus("idle");
    }
  };

  /* -------------------- UI -------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-medium">
        <svg
          className="animate-spin h-5 w-5 mr-3"
          viewBox="0 0 24 24"
        ></svg>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Election Manager
            </h1>
            <p className="text-gray-500 mt-1">
              Create, monitor, and manage blockchain voting events.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="group relative bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Create Election
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex p-1 bg-white rounded-xl border border-gray-200 w-fit shadow-sm">
          {[
            { id: "all", label: "All Elections" },
            { id: "draft", label: "Drafts" },
            { id: "active", label: "Live Now" },
            { id: "closed", label: "Ended" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === tab.id
                  ? "bg-gray-100 text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Elections Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl shadow-gray-200/40">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Chain ID
                </th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">
                  Title
                </th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredElections.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="p-5">{getStatusBadge(e.status)}</td>
                  <td className="p-5 font-mono text-xs text-gray-400">
                    #{e.blockchain_id}
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-gray-900">{e.title}</div>
                    {e.description && (
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                        {e.description}
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {new Date(e.start_time * 1000).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {new Date(e.end_time * 1000).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      {/* Candidates Button */}
                      <button
                        onClick={() =>
                          navigate("/admin/candidates", {
                            state: { election: e },
                          })
                        }
                        className="text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Candidates
                      </button>

                      {/* Results Button */}
                      <button
                        onClick={() => navigate(`/results/${e.id}`)}
                        className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Results
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredElections.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-sm font-medium">
                        No elections found in this category.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 transform transition-all scale-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    New Election
                  </h2>
                  <p className="text-sm text-gray-500">
                    Define the details and timeline.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Title</label>
                  <input
                    placeholder="e.g. Student Council 2024"
                    className="block w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Description</label>
                  <textarea
                    placeholder="Brief description of the event..."
                    className="block w-full px-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none h-24 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Start</label>
                    <input
                      type="datetime-local"
                      className="block w-full px-3 py-2.5 bg-gray-50 border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">End</label>
                    <input
                      type="datetime-local"
                      className="block w-full px-3 py-2.5 bg-gray-50 border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={createElection}
                  disabled={txStatus !== "idle"}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
                >
                  {txStatus === "wallet" && (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Sign in Wallet...
                    </>
                  )}
                  {txStatus === "mining" && (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Mining Block...
                    </>
                  )}
                  {txStatus === "success" && "Success!"}
                  {txStatus === "idle" && "Create on Blockchain"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}