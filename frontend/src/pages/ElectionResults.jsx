import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BlockchainContext } from "../context/BlockChainContext";

export default function ElectionResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract } = useContext(BlockchainContext);
  const token = localStorage.getItem("token");

  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchData();
  }, [id, contract]);

  const fetchData = async () => {
    try {
        const electionRes = await fetch("http://localhost:8000/admin/elections", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const allElections = await electionRes.json();
        const currentElection = allElections.find(e => e.id === id);
        
        if (!currentElection) {
            alert("Election not found");
            navigate("/dashboard");
            return;
        }
        setElection(currentElection);

        const candRes = await fetch(`http://localhost:8000/elections/${id}/candidates`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const mongoCandidates = await candRes.json();

        if (contract && currentElection.blockchain_id) {
            const [chainIds, chainVotes] = await contract.getResults(currentElection.blockchain_id);
            
            const mergedResults = mongoCandidates.map(c => {
                const index = chainIds.findIndex(bnId => Number(bnId) === c.candidate_id);
                return {
                    ...c,
                    voteCount: index !== -1 ? Number(chainVotes[index]) : 0
                };
            });

            mergedResults.sort((a, b) => b.voteCount - a.voteCount);
            setResults(mergedResults);
        } else {
            setResults(mongoCandidates.map(c => ({ ...c, voteCount: 0 })));
        }

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading results...
    </div>
  );

  const totalVotes = results.reduce((acc, curr) => acc + curr.voteCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation */}
        <button 
            onClick={() => navigate(-1)} 
            className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <span className="bg-white p-1 rounded-full shadow-sm mr-2 group-hover:bg-blue-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </span>
          Back
        </button>

        {/* Election Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{election?.title}</h1>
                    <p className="text-gray-500 text-sm">Official Result Audit</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-blue-50 px-5 py-3 rounded-xl border border-blue-100 text-center">
                        <span className="block text-2xl font-bold text-blue-700 leading-none">{totalVotes}</span>
                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Total Votes</span>
                    </div>
                    {contract ? (
                        <div className="bg-green-50 px-4 py-3 rounded-xl border border-green-100 flex items-center gap-2 text-green-700 text-xs font-bold uppercase">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live Data
                        </div>
                    ) : (
                        <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold uppercase">
                            Offline
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-4">
          {results.map((c, index) => {
            const percentage = totalVotes === 0 ? 0 : ((c.voteCount / totalVotes) * 100).toFixed(1);
            const isWinner = index === 0 && totalVotes > 0;

            return (
              <div 
                key={c.id} 
                className={`bg-white p-6 rounded-2xl border transition-all duration-200
                    ${isWinner 
                        ? 'border-blue-500 ring-1 ring-blue-100 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                `}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${isWinner ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}
                    `}>
                        #{index + 1}
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {c.name}
                            {isWinner && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Leading</span>}
                        </h3>
                        <p className="text-sm text-gray-500">{c.party}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-2xl font-bold text-gray-900">{c.voteCount}</span>
                    <span className="text-xs text-gray-400 font-medium uppercase">Votes</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                        <span>Performance</span>
                        <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-700 ease-out ${isWinner ? 'bg-blue-600' : 'bg-gray-400'}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}