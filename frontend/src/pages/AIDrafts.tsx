import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Loader2, BookOpen } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import ClauseLibraryModal from "../components/ClauseLibraryModal";

interface Matter {
  id: string;
  matterNumber: string;
  title: string;
  court: string;
  client?: {
    fullName: string;
  };
}

export default function AIDrafts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);

  const [form, setForm] = useState({
    matterId: "",
    documentType: "Legal Notice",
    clientName: "",
    matterTitle: "",
    court: "",
    facts: "",
  });

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setShowClauseLibrary(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    const initialize = async () => {
      try {
        // Load all matters first (needed for dropdown)
        const { data: mattersData } = await api.get("/Matters");
        setMatters(mattersData);

        // Check if user came from Matter Workspace
        const matterId = searchParams.get("matterId");

        if (matterId) {
          const matter = mattersData.find((m: Matter) => m.id === matterId);

          if (matter) {
            setForm((prev) => ({
              ...prev,
              matterId: matter.id,
              clientName: matter.client?.fullName ?? "",
              matterTitle: matter.title,
              court: matter.court,
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    initialize();

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [searchParams]);

  const selectMatter = (id: string) => {
    const matter = matters.find((m) => m.id === id);

    setForm((prev) => ({
      ...prev,
      matterId: id,
      clientName: matter?.client?.fullName ?? "",
      matterTitle: matter?.title ?? "",
      court: matter?.court ?? "",
    }));
  };

  const generateDraft = async () => {
    if (!form.matterId) {
      alert("Please select a Matter.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        matterId: form.matterId,
        documentType: form.documentType,
        facts: form.facts,
      };

      const { data } = await api.post("/Documents/generate", payload);

      if (data?.id) {
        navigate(`/documents/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate draft.");
    } finally {
      setLoading(false);
    }
  };

  const insertClause = (content: string) => {
    setForm((prev) => ({
      ...prev,
      facts: prev.facts ? `${prev.facts}\n\n${content}` : content,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                AI Drafts
              </h1>

              <p className="text-slate-500">
                Generate professional legal drafts using DraftLex AI.
              </p>
            </div>

            <UserMenu />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Matter Dropdown */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Select Matter *
                </label>

                <select
                  value={form.matterId}
                  onChange={(e) => selectMatter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3"
                >
                  <option value="">Select a Matter</option>

                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.matterNumber} • {matter.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Document Type
                </label>

                <select
                  value={form.documentType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      documentType: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                >
                  <option>Legal Notice</option>
                  <option>Reply Notice</option>
                  <option>Affidavit</option>
                  <option>Plaint</option>
                  <option>Written Statement</option>
                </select>
              </div>

              {/* Client */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Client Name
                </label>

                <input
                  value={form.clientName}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3"
                />
              </div>

              {/* Matter Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Matter Title
                </label>

                <input
                  value={form.matterTitle}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3"
                />
              </div>

              {/* Court */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Court
                </label>

                <input
                  value={form.court}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3"
                />
              </div>
            </div>

            {/* Facts */}
            <div className="mt-6 flex items-center justify-between">
              <label className="text-sm font-medium">
                Facts of the Case
              </label>

              <button
                type="button"
                onClick={() => setShowClauseLibrary(true)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                title="Ctrl + Shift + I"
              >
                <BookOpen size={18} />
                Clause Library
              </button>
            </div>

            <textarea
              rows={10}
              value={form.facts}
              onChange={(e) =>
                setForm({
                  ...form,
                  facts: e.target.value,
                })
              }
              placeholder="Describe the facts or insert ready-made clauses..."
              className="mt-2 w-full rounded-lg border border-slate-300 p-4"
            />

            {/* Generate Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={generateDraft}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}

                {loading ? "Generating..." : "Generate Draft"}
              </button>
            </div>
          </div>
        </main>
      </div>

      <ClauseLibraryModal
        open={showClauseLibrary}
        onClose={() => setShowClauseLibrary(false)}
        onInsert={insertClause}
      />
    </div>
  );
}