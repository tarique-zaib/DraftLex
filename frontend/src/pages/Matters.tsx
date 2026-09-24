import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Scale, User, Landmark } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import NewMatterModal from "../components/NewMatterModal";
import { legalText } from "../utils/legalTranslations";
import i18n from "../i18n";

interface Matter {
  id: string;
  matterNumber: string;
  title: string;
  matterType: string;
  court: string;
  status: string;
  client?: {
    fullName: string;
  };
}

export default function Matters() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [filtered, setFiltered] = useState<Matter[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewMatter, setShowNewMatter] = useState(false);

  // Re-render on language change
  const [, setLang] = useState(i18n.language);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);

    return () => i18n.off("languageChanged", onChange);
  }, []);

  useEffect(() => {
    loadMatters();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();

    setFiltered(
      matters.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.matterNumber.toLowerCase().includes(term) ||
          m.court.toLowerCase().includes(term) ||
          (m.client?.fullName ?? "").toLowerCase().includes(term),
      ),
    );
  }, [search, matters]);

  const loadMatters = async () => {
    try {
      const { data } = await api.get<Matter[]>("/Matters");
      setMatters(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "closed":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-blue-100 text-blue-700";
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
                {i18n.t("matters")}
              </h1>

              <p className="text-slate-500">
                {i18n.t("manageMattersSubtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewMatter(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                {i18n.t("newMatter")}
              </button>

              <UserMenu />
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={i18n.t("searchMatters")}
              className="w-full text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>

          {/* Matter Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                {i18n.t("loadingMatters")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                {i18n.t("noMatters")}
              </div>
            ) : (
              filtered.map((matter) => (
                <Link
                  key={matter.id}
                  to={`/matters/${matter.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                          <Scale size={22} />
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {matter.title}
                          </h3>

                          <p className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {matter.matterNumber}
                          </p>
                        </div>
                      </div>

                      {/* Chips */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          <User size={14} />
                          {i18n.t("client")}: {matter.client?.fullName || "—"}
                        </span>

                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          <Landmark size={14} />
                          {i18n.t("court")}: {matter.court}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          📁 {i18n.t("matterType")}:{" "}
                          {matter.matterType
                            ? legalText(matter.matterType)
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(
                        matter.status,
                      )}`}
                    >
                      {legalText(matter.status)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <NewMatterModal
            open={showNewMatter}
            onClose={() => setShowNewMatter(false)}
            onCreated={loadMatters}
          />
        </main>
      </div>
    </div>
  );
}
