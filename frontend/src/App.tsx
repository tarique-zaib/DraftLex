import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalSearch from "./components/GlobalSearch";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MatterWorkspace = lazy(() => import("./pages/MatterWorkspace"));
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"));
const Login = lazy(() => import("./pages/Login"));
const Clients = lazy(() => import("./pages/Clients"));
const Matters = lazy(() => import("./pages/Matters"));
const Hearings = lazy(() => import("./pages/Hearings"));
const Documents = lazy(() => import("./pages/Documents"));
const AIDrafts = lazy(() => import("./pages/AIDrafts"));
const ClientDetails = lazy(() => import("./pages/ClientDetails"));

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

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <span className="font-medium text-slate-700">
                  Loading DraftLex...
                </span>
              </div>
            </div>
          </div>
        }
      >
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
      </Suspense>
    </>
  );
}