import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Users, Scale, CalendarDays, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import UserMenu from "../components/UserMenu";
import Sidebar from "../components/Sidebar";
import LanguageToggle from "../components/LanguageToggle";
import { useAuth } from "../context/AuthContext";
import { legalText } from "../utils/legalTranslations";
import i18n from "../i18n";
import "../index.css";

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">{value}</h2>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Forces re-render when language changes
  const [, setLang] = useState(i18n.language);

  const displayName = user?.email
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : "Advocate";

  const [stats, setStats] = useState({
    clients: 0,
    matters: 0,
    hearings: 0,
    documents: 0,
  });

  const [matters, setMatters] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);

    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [clientsRes, mattersRes, hearingsRes, documentsRes] =
          await Promise.all([
            api.get("/Clients"),
            api.get("/Matters"),
            api.get("/Hearings"),
            api.get("/Documents"),
          ]);

        setMatters(mattersRes.data.slice(0, 5));
        setHearings(hearingsRes.data.slice(0, 5));

        setStats({
          clients: clientsRes.data.length,
          matters: mattersRes.data.length,
          hearings: hearingsRes.data.length,
          documents: documentsRes.data.length,
        });
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {i18n.t("welcome", { name: displayName })}
              </h1>

              <p className="text-slate-500">
                {i18n.t("manageClientsMattersAiDrafts")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/ai-drafts")}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                + {i18n.t("generateDraft")}
              </button>

              <LanguageToggle />

              <UserMenu />
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={i18n.t("clients")}
              value={stats.clients.toString()}
              icon={<Users size={24} />}
            />

            <StatCard
              title={i18n.t("activeMatters")}
              value={stats.matters.toString()}
              icon={<Scale size={24} />}
            />

            <StatCard
              title={i18n.t("hearings")}
              value={stats.hearings.toString()}
              icon={<CalendarDays size={24} />}
            />

            <StatCard
              title={i18n.t("aiDocuments")}
              value={stats.documents.toString()}
              icon={<FileText size={24} />}
            />
          </div>

          {/* Recent Matters & Hearings */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Recent Matters */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">
                {i18n.t("recentMatters")}
              </h2>

              <div className="space-y-3">
                {matters.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    {i18n.t("noMattersYet")}
                  </div>
                ) : (
                  matters.map((m) => (
                    <Link
                      key={m.id}
                      to={`/matters/${m.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {m.title}
                        </p>

                        <p className="text-sm text-slate-500">
                          {m.matterNumber}
                        </p>
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                        {legalText(m.status)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Hearings */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">
                {i18n.t("upcomingHearings")}
              </h2>

              <div className="space-y-3">
                {hearings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    {i18n.t("noHearingsScheduled")}
                  </div>
                ) : (
                  hearings.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {legalText(h.stage)}
                        </p>

                        <p className="text-sm text-slate-500">
                          {new Date(h.hearingDate).toLocaleDateString(
                            i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>

                        <p className="text-xs text-slate-400">
                          {legalText(h.judgeName || "Judge TBD")} •{" "}
                          {legalText(h.courtRoom || "Court TBD")}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        {i18n.t("upcoming")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
