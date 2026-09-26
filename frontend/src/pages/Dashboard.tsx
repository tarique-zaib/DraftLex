import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Users,
  Scale,
  CalendarDays,
  FileText,
  Clock,
  CalendarPlus,
  Sparkles,
  ArrowRight,
  Landmark,
  User,
  Gavel,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  const [todayHearings, setTodayHearings] = useState<any[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([]);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await api.get("/Hearings/dashboard");

        setTodayHearings(data.today || []);
        setUpcomingHearings(data.upcoming || []);

        setStats({
          clients: data.stats.clients,
          matters: data.stats.activeMatters,
          hearings: data.stats.hearings,
          documents: data.stats.documents,
        });
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };

    loadDashboard();

    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  function getUpcomingBadge(date: string) {
    const hearingDate = new Date(date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    hearingDate.setHours(0, 0, 0, 0);

    const diff = Math.round(
      (hearingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diff === 0)
      return { text: i18n.t("today"), cls: "bg-red-100 text-red-700" };

    if (diff === 1)
      return { text: i18n.t("tomorrow"), cls: "bg-orange-100 text-orange-700" };

    if (diff <= 3)
      return {
        text: `${diff} ${i18n.t("days")}`,
        cls: "bg-yellow-100 text-yellow-700",
      };

    return { text: i18n.t("upcoming"), cls: "bg-blue-100 text-blue-700" };
  }

  function timeRemaining(date: string) {
    const diff = new Date(date).getTime() - Date.now();

    if (diff <= 0) return i18n.t("inProgress");

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    return `${i18n.t("startsIn")} ${h}h ${m}m`;
  }

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

          {/* Quick Actions */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={() => navigate("/hearings")}
              className="rounded-xl bg-blue-600 p-5 text-left text-white shadow transition hover:bg-blue-700"
            >
              <CalendarPlus className="mb-3" size={28} />
              <div className="font-semibold">{i18n.t("newHearing")}</div>
            </button>

            <button
              onClick={() => navigate("/documents")}
              className="rounded-xl bg-emerald-600 p-5 text-left text-white shadow transition hover:bg-emerald-700"
            >
              <FileText className="mb-3" size={28} />
              <div className="font-semibold">{i18n.t("newDocument")}</div>
            </button>

            <button
              onClick={() => navigate("/ai-drafts")}
              className="rounded-xl bg-purple-600 p-5 text-left text-white shadow transition hover:bg-purple-700"
            >
              <Sparkles className="mb-3" size={28} />
              <div className="font-semibold">{i18n.t("aiDraft")}</div>
            </button>

            <button
              onClick={() => navigate("/hearings")}
              className="rounded-xl bg-amber-500 p-5 text-left text-white shadow transition hover:bg-amber-600"
            >
              <CalendarDays className="mb-3" size={28} />
              <div className="font-semibold">{i18n.t("calendar")}</div>
            </button>
          </div>

          {/* Cause List */}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Today's Cause List */}

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {i18n.t("todaysCauseList")}
                </h2>

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  {i18n.t("today")}
                </span>
              </div>

              <div className="space-y-3">
                {todayHearings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    {i18n.t("noHearingsToday")}
                  </div>
                ) : (
                  todayHearings.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => navigate(`/matters/${h.matterId}`)}
                      className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-bold text-slate-900">
                            {legalText(h.matterTitle)}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {i18n.t("matterNo")} {h.matterNumber}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                          {new Date(h.hearingDate).toLocaleTimeString(
                            i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span>{legalText(h.clientName)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Landmark size={16} className="text-slate-400" />
                          <span>{legalText(h.court)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Gavel size={16} className="text-slate-400" />
                          <span>{legalText(h.stage)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock size={16} />
                          {timeRemaining(h.hearingDate)}
                        </div>

                        <ArrowRight size={18} className="text-slate-400" />
                      </div>
                    </button>
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
                {upcomingHearings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    {i18n.t("noHearingsScheduled")}
                  </div>
                ) : (
                  upcomingHearings.map((h) => {
                    const badge = getUpcomingBadge(h.hearingDate);

                    return (
                      <button
                        key={h.id}
                        onClick={() => navigate(`/matters/${h.matterId}`)}
                        className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {legalText(h.matterTitle)}
                            </p>

                            <p className="text-sm text-slate-500">
                              {legalText(h.clientName)} • {legalText(h.court)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(h.hearingDate).toLocaleDateString(
                                i18n.language.startsWith("hi")
                                  ? "hi-IN"
                                  : "en-IN",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-sm ${badge.cls}`}
                          >
                            {badge.text}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
