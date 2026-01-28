import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:8000/elections-details", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate("/login");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(setElections)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading active elections...
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Elections</h1>
        <p className="text-gray-500 mb-8">Cast your vote securely on the blockchain.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                    ID #{e.blockchain_id}
                  </span>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="Live"></div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {e.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {e.description || "No description provided."}
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-50">
                <div className="flex items-center text-xs text-gray-400 mb-4 font-medium">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Ends: {new Date(e.end_time * 1000).toLocaleString()}
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate(`/elections/${e.id}`, { state: { election: e } })}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                    >
                        Vote Now
                    </button>
                    <button 
                        onClick={() => navigate(`/results/${e.id}`)}
                        className="px-4 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-white hover:border-gray-300 hover:text-gray-900 transition"
                    >
                        Results
                    </button>
                </div>
              </div>
            </div>
          ))}

          {elections.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No active elections</h3>
              <p className="text-gray-500 mt-1">There are currently no elections open for voting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}