import { useEffect, useState, useRef, useMemo } from "react";
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
  Bell,
  CheckCheck,
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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [{ data }, { data: activity }] = await Promise.all([
          api.get("/Hearings/dashboard"),
          api.get("/Matters/recent-activity"),
        ]);

        setRecentActivity(activity);
        console.log("Recent Activity:", activity);

        setTodayHearings(data.today || []);
        setUpcomingHearings(data.upcoming || []);

        setStats({
          clients: data.stats.clients,
          matters: data.stats.activeMatters,
          hearings: data.stats.hearings,
          documents: data.stats.documents,
        });

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

    const interval = setInterval(loadDashboard, 5000);

    const refreshOnFocus = () => loadDashboard();
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
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

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();

    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return i18n.language.startsWith("hi") ? "अभी" : "Just now";

    if (mins < 60)
      return i18n.language.startsWith("hi")
        ? `${mins} मिनट पहले`
        : `${mins} min ago`;

    if (hrs < 24)
      return i18n.language.startsWith("hi")
        ? `${hrs} घंटे पहले`
        : `${hrs} hour${hrs > 1 ? "s" : ""} ago`;

    if (days === 1) return i18n.language.startsWith("hi") ? "कल" : "Yesterday";

    return i18n.language.startsWith("hi")
      ? `${days} दिन पहले`
      : `${days} days ago`;
  }

  const translateActivityTitle = (title: string) => {
    if (!i18n.language.startsWith("hi")) return title;

    switch (title) {
      case "AI Draft Generated":
        return "एआई मसौदा तैयार किया गया";

      case "Document Created":
        return "दस्तावेज़ बनाया गया";

      case "Matter Updated":
        return "मामला अद्यतन किया गया";

      case "Hearing Scheduled":
        return "सुनवाई निर्धारित की गई";

      case "Hearing Completed":
        return "सुनवाई पूरी हुई";

      default:
        return title;
    }
  };

  const unreadCount = recentActivity.filter(
    (a) => !readIds.includes(a.id),
  ).length;

  console.log("Upcoming Hearings:", upcomingHearings);

  const weeklyData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const allHearings = [...todayHearings, ...upcomingHearings];

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    allHearings.forEach((h: any) => {
      const hearingDate = new Date(h.hearingDate);
      hearingDate.setHours(0, 0, 0, 0);

      if (hearingDate >= startOfWeek && hearingDate < endOfWeek) {
        counts[hearingDate.getDay()]++;
      }
    });

    return [
      { day: "Sun", count: counts[0] },
      { day: "Mon", count: counts[1] },
      { day: "Tue", count: counts[2] },
      { day: "Wed", count: counts[3] },
      { day: "Thu", count: counts[4] },
      { day: "Fri", count: counts[5] },
      { day: "Sat", count: counts[6] },
    ];
  }, [todayHearings, upcomingHearings]);

  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-slate-100 p-4 pt-24 lg:p-8 lg:pt-8">
          {/* Header */}

          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                {i18n.t("welcome", { name: displayName })}
              </h1>

              <p className="mt-2 text-slate-500">
                {i18n.t("manageClientsMattersAiDrafts")}
              </p>
            </div>

            {/* Right */}
            <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:flex-nowrap lg:justify-end">
              <button
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                onClick={() => navigate("/ai-drafts")}
              >
                + {i18n.t("generateDraft")}
              </button>

              {/* Notification Center */}
              <div className="relative shrink-0" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
                >
                  <Bell size={20} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed left-4 right-4 top-24 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {i18n.language.startsWith("hi")
                            ? "सूचनाएँ"
                            : "Notifications"}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {unreadCount}{" "}
                          {i18n.language.startsWith("hi")
                            ? "नई गतिविधियाँ"
                            : "new updates"}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setReadIds(recentActivity.map((a) => a.id))
                        }
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <CheckCheck size={18} />
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {recentActivity.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          {i18n.language.startsWith("hi")
                            ? "कोई सूचना नहीं"
                            : "No notifications"}
                        </div>
                      ) : (
                        recentActivity.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setReadIds((prev) =>
                                prev.includes(item.id)
                                  ? prev
                                  : [...prev, item.id],
                              );
                              setShowNotifications(false);
                              navigate(`/matters/${item.matterId}`);
                            }}
                            className={`flex w-full items-start gap-3 border-b p-4 text-left transition hover:bg-slate-50 ${
                              readIds.includes(item.id)
                                ? "bg-white"
                                : "bg-blue-50"
                            }`}
                          >
                            <div
                              className={`mt-1 rounded-full p-2 ${
                                item.type === "Document"
                                  ? "bg-blue-100 text-blue-700"
                                  : item.type === "Hearing"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {item.type === "Document" ? (
                                <FileText size={16} />
                              ) : item.type === "Hearing" ? (
                                <CalendarDays size={16} />
                              ) : (
                                <Scale size={16} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-medium text-slate-900">
                                  {translateActivityTitle(item.title)}
                                </p>

                                {!readIds.includes(item.id) && (
                                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                                )}
                              </div>

                              <p className="mt-1 text-sm text-slate-600">
                                {item.description
                                  ? legalText(item.description)
                                  : legalText(item.matterTitle)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {timeAgo(item.createdAt)}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <LanguageToggle />

              <div className="min-w-fit">
                <UserMenu />
              </div>
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

          {/* Weekly Hearings */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {i18n.language.startsWith("hi")
                    ? "साप्ताहिक सुनवाई"
                    : "Weekly Hearings"}
                </h2>

                <p className="text-sm text-slate-500">
                  {i18n.language.startsWith("hi")
                    ? "आगामी 7 दिनों की गतिविधि"
                    : "Upcoming hearing activity"}
                </p>
              </div>

              <CalendarDays className="text-blue-600" size={28} />
            </div>

            <div className="space-y-4">
              {weeklyData.map((item: { day: string; count: number }) => (
                <div key={item.day} className="flex items-center gap-4">
                  <div className="w-10 text-sm font-medium text-slate-600">
                    {item.day}
                  </div>

                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="w-8 text-right text-sm font-semibold text-slate-700">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Priority */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">
                  {i18n.language.startsWith("hi")
                    ? "आज की सर्वोच्च प्राथमिकता"
                    : "Today's Priority"}
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {todayHearings.length > 0
                    ? legalText(todayHearings[0].matterTitle)
                    : i18n.language.startsWith("hi")
                      ? "आज कोई सुनवाई नहीं"
                      : "No Hearing Today"}
                </h2>
              </div>

              <div className="rounded-full bg-white/20 p-4">
                <Gavel size={30} />
              </div>
            </div>

            {todayHearings.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-blue-100">
                      {i18n.language.startsWith("hi") ? "समय" : "Time"}
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {new Date(
                        todayHearings[0].hearingDate,
                      ).toLocaleTimeString(
                        i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-blue-100">
                      {i18n.language.startsWith("hi") ? "न्यायालय" : "Court"}
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {legalText(todayHearings[0].court)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-blue-100">
                      {i18n.language.startsWith("hi") ? "चरण" : "Stage"}
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {legalText(todayHearings[0].stage)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-5">
                  <div className="flex items-center gap-2 text-blue-100">
                    <Clock size={18} />
                    {timeRemaining(todayHearings[0].hearingDate)}
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/matters/${todayHearings[0].matterId}`)
                    }
                    className="rounded-lg bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    {i18n.language.startsWith("hi")
                      ? "मामला खोलें"
                      : "Open Matter"}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-white/10 p-6 text-center text-blue-100">
                {i18n.language.startsWith("hi")
                  ? "आज आपकी कोई सुनवाई निर्धारित नहीं है।"
                  : "You're clear for today."}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {i18n.language.startsWith("hi")
                    ? "हाल की गतिविधियाँ"
                    : "Recent Activity"}
                </h2>

                <p className="text-sm text-slate-500">
                  {i18n.language.startsWith("hi")
                    ? "आपके हाल के केस अपडेट"
                    : "Your latest case updates"}
                </p>
              </div>

              <Clock className="text-blue-600" size={28} />
            </div>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  {i18n.language.startsWith("hi")
                    ? "कोई गतिविधि नहीं"
                    : "No recent activity"}
                </div>
              ) : (
                recentActivity.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/matters/${item.matterId}`)}
                    className="flex w-full items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-slate-50"
                  >
                    <div
                      className={`rounded-full p-3 ${
                        item.type === "Document"
                          ? "bg-blue-100 text-blue-700"
                          : item.type === "Hearing"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {item.type === "Document" ? (
                        <FileText size={20} />
                      ) : item.type === "Hearing" ? (
                        <CalendarDays size={20} />
                      ) : (
                        <Scale size={20} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          className={`font-semibold text-slate-900 ${
                            i18n.language.startsWith("hi") ? "font-hi" : ""
                          }`}
                        >
                          {translateActivityTitle(item.title)}
                        </h3>

                        <span className="text-xs text-slate-400">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {i18n.language.startsWith("hi")
                          ? (item.description || "")
                              .replace("created for", "तैयार किया गया:")
                              .replace("Legal Notice", "कानूनी नोटिस")
                              .replace("Reply Notice", "उत्तर नोटिस")
                              .replace("Affidavit", "शपथपत्र")
                              .replace("Plaint", "वाद पत्र")
                              .replace("Written Statement", "लिखित बयान")
                              .replace(
                                "Bail Application",
                                "जमानत प्रार्थना पत्र",
                              )
                              .replace("Arguments", "लिखित बहस")
                              .replace("Case Summary", "मामले का सार")
                          : item.description
                            ? legalText(item.description)
                            : item.type === "Hearing"
                              ? `${legalText(item.title)} • ${legalText(item.matterTitle)}`
                              : legalText(item.matterTitle)}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {legalText(item.matterTitle)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
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
                      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                              {new Intl.DateTimeFormat(
                                i18n.language.startsWith("hi")
                                  ? "hi-IN"
                                  : "en-IN",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  timeZone: "Asia/Kolkata",
                                },
                              ).format(new Date(h.hearingDate))}
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
