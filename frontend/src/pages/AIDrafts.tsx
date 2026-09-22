import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";

export default function AIDrafts() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    documentType: "Legal Notice",
    clientName: "",
    matterTitle: "",
    court: "",
    facts: "",
  });

  const generateDraft = async () => {
    try {
      setLoading(true);

      const { data } = await api.post("/Documents/generate", form);

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

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Drafts</h1>
              <p className="text-slate-500">
                Generate legal drafts using DraftLex AI.
              </p>
            </div>

            <UserMenu />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Document Type
                </label>

                <select
                  value={form.documentType}
                  onChange={(e) =>
                    setForm({ ...form, documentType: e.target.value })
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

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Client Name
                </label>

                <input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Matter Title
                </label>

                <input
                  value={form.matterTitle}
                  onChange={(e) =>
                    setForm({ ...form, matterTitle: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Court</label>

                <input
                  value={form.court}
                  onChange={(e) =>
                    setForm({ ...form, court: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium">
                Facts of the Case
              </label>

              <textarea
                rows={8}
                value={form.facts}
                onChange={(e) =>
                  setForm({ ...form, facts: e.target.value })
                }
                placeholder="Describe the facts..."
                className="w-full rounded-lg border border-slate-300 p-4"
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
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
    </div>
  );
}