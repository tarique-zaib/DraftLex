import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MatterWorkspace from "./pages/MatterWorkspace";
import DocumentViewer from "./pages/DocumentViewer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matters/:id" element={<MatterWorkspace />} />
        <Route path="/documents/:id" element={<DocumentViewer />} />
      </Routes>
    </BrowserRouter>
  );
}