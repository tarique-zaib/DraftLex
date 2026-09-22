import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Eye } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";

interface Document {
  id: string;
  title: string;
  documentType: string;
  version: number;
  updatedAt: string;
  matter?: {
    title: string;
    matterNumber: string;
  };
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filtered, setFiltered] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();

    setFiltered(
      documents.filter(
        (d) =>
          d.title.toLowerCase().includes(term) ||
          d.documentType.toLowerCase().includes(term) ||
          (d.matter?.title ?? "").toLowerCase().includes(term)
      )
    );
  }, [search, documents]);

  const loadDocuments = async () => {
    try {
      const { data } = await api.get<Document[]>("/Documents");
      setDocuments(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
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
              <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
              <p className="text-slate-500">
                Browse AI-generated legal documents.
              </p>
            </div>

            <UserMenu />
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full outline-none"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center">
                Loading documents...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                No documents found.
              </div>
            ) : (
              filtered.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                          <FileText size={22} />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {doc.title}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {doc.documentType} • Version {doc.version}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                          <span className="font-medium">Matter:</span>{" "}
                          {doc.matter?.title || "—"}
                        </div>

                        <div>
                          <span className="font-medium">Updated:</span>{" "}
                          {new Date(doc.updatedAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                      <Eye size={16} />
                      Open
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}