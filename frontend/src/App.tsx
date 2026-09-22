import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MatterWorkspace from "./pages/MatterWorkspace";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matters/:id" element={<MatterWorkspace />} />
      </Routes>
    </BrowserRouter>
  );
}