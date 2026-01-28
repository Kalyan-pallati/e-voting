import { Routes, Route } from "react-router-dom";
import { BlockchainProvider } from "./context/BlockChainContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminElections from "./pages/AdminElections";
import AdminCandidates from "./pages/AdminCandidate";
import UserElections from "./pages/UserElections";
import UserElectionDetails from "./pages/UserElectionDetails";
import ElectionResults from "./pages/ElectionResults";
import Layout from "./components/Layout"; // 
import ToastProvider from "./context/ToastContext";

function App() {
  return (
    <BlockchainProvider>
      <ToastProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/elections" element={<AdminElections />} />
            <Route path="/admin/candidates" element={<AdminCandidates />} />
            
            <Route path="/elections" element={<UserElections />} />
            <Route path="/elections/:id" element={<UserElectionDetails />} />

            <Route path="/results/:id" element={<ElectionResults />} />
        </Route>
      </Routes>
      </ToastProvider>
    </BlockchainProvider>
  );
}

export default App;