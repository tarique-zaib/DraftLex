import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MatterWorkspace from "./pages/MatterWorkspace";
import DocumentViewer from "./pages/DocumentViewer";
import Login from "./pages/Login";
import Clients from "./pages/Clients";
import Matters from "./pages/Matters";
import Hearings from "./pages/Hearings";
import Documents from "./pages/Documents";
import AIDrafts from "./pages/AIDrafts";
import ClientDetails from "./pages/ClientDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalSearch from "./components/GlobalSearch";

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matters"
          element={
            <ProtectedRoute>
              <Matters />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hearings"
          element={
            <ProtectedRoute>
              <Hearings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-drafts"
          element={
            <ProtectedRoute>
              <AIDrafts />
            </ProtectedRoute>
          }
        />

        <Route path="/clients/:id" element={<ClientDetails />} />

        <Route
          path="/matters/:id"
          element={
            <ProtectedRoute>
              <MatterWorkspace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <DocumentViewer />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}