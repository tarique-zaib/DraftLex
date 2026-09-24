import { useEffect, useState } from "react";
import { Search, FileText, Eye, Scale, ScrollText, Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import i18n from "../i18n";
import { legalText } from "../utils/legalTranslations";

interface DocumentItem {
  id: string;
  title: string;
  documentType: string;
  version: number;
  updatedAt: string;
  matterId?: string;
  matterTitle?: string;
}

export default function Documents() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filtered, setFiltered] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [, setLang] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

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
          (d.matterTitle || "").toLowerCase().includes(term),
      ),
    );
  }, [search, documents]);

  const loadDocuments = async () => {
    try {
      const { data } = await api.get<DocumentItem[]>("/Documents");
      setDocuments(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "legal notice":
        return <FileText size={22} className="text-blue-600" />;

      case "vakalatnama":
        return <Scale size={22} className="text-indigo-600" />;

      case "affidavit":
        return <ScrollText size={22} className="text-green-600" />;

      case "bail application":
        return <Gavel size={22} className="text-amber-600" />;

      default:
        return <FileText size={22} className="text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {i18n.t("documents")}
              </h1>

              <p className="text-slate-500">
                {i18n.t("documentsSubtitle")}
              </p>
            </div>

            <UserMenu />
          </div>

          {/* Search */}

          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={i18n.t("searchDocuments")}
              className="w-full outline-none"
            />
          </div>

          {/* List */}

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center">
                {i18n.t("loadingDocuments")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                <div className="mb-2 text-lg font-semibold">
                  {i18n.t("noDocuments")}
                </div>

                <p>{i18n.t("noDocumentsHint")}</p>
              </div>
            ) : (
              filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    {/* Left */}

                    <div className="flex gap-4">
                      <div className="rounded-xl bg-blue-50 p-4">
                        {getIcon(doc.documentType)}
                      </div>

                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                            {legalText(doc.documentType)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {i18n.t("version")} {doc.version}
                          </span>
                        </div>

                        <h2 className="text-xl font-semibold text-slate-900">
                          {doc.title}
                        </h2>

                        <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <div>
                            <span className="font-medium">
                              {i18n.t("matter")}:
                            </span>{" "}
                            {doc.matterTitle || i18n.t("notAssigned")}
                          </div>

                          <div>
                            <span className="font-medium">
                              {i18n.t("updated")}:
                            </span>{" "}
                            {new Date(doc.updatedAt).toLocaleDateString(
                              i18n.language.startsWith("hi")
                                ? "hi-IN"
                                : "en-IN",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right */}

                    <button
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye size={18} />
                      {i18n.t("open")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}