import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gavel,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import NewHearingModal from "../components/NewHearingModal";
import RescheduleHearingModal from "../components/RescheduleHearingModal";
import i18n from "../i18n";
import HearingPreparationPanel from "../components/HearingPreparationPanel";

interface Hearing {
  id: string;
  hearingDate: string;
  stage: string;
  judgeName?: string;
  courtRoom?: string;
  isCompleted?: boolean;
  matter?: {
    id: string;
    title: string;
    matterNumber: string;
    court?: string;
  };
}

const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date, hindi: boolean) {
  return date.toLocaleDateString(hindi ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string, hindi: boolean) {
  return new Date(value).toLocaleTimeString(hindi ? "hi-IN" : "en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Hearings() {
  const [, setLang] = useState(i18n.language);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [showNewHearing, setShowNewHearing] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [showPreparation, setShowPreparation] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const hindi = i18n.language.startsWith("hi");

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  const loadHearings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/Hearings");
      setHearings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load hearings:", err);
      setHearings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHearings();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return hearings;

    return hearings.filter((h) =>
      [
        h.matter?.title,
        h.matter?.matterNumber,
        h.matter?.court,
        h.courtRoom,
        h.stage,
        h.judgeName,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [hearings, search]);

  const today = startOfDay(new Date());

  const todaysHearings = useMemo(
    () =>
      filtered
        .filter((h) => isSameDay(new Date(h.hearingDate), today))
        .sort(
          (a, b) =>
            new Date(a.hearingDate).getTime() -
            new Date(b.hearingDate).getTime(),
        ),
    [filtered, today.getTime()],
  );

  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const tomorrowHearings = useMemo(
    () =>
      filtered
        .filter((h) => isSameDay(new Date(h.hearingDate), tomorrowDate))
        .sort(
          (a, b) =>
            new Date(a.hearingDate).getTime() -
            new Date(b.hearingDate).getTime(),
        ),
    [filtered, tomorrowDate.getTime()],
  );

  const todaysCount = todaysHearings.filter((h) => !h.isCompleted).length;

  const upcomingCount = filtered.filter((h) => {
    const date = new Date(h.hearingDate);
    return !h.isCompleted && startOfDay(date).getTime() > today.getTime();
  }).length;

  const completedCount = filtered.filter((h) => {
    const date = new Date(h.hearingDate);
    return h.isCompleted || startOfDay(date).getTime() < today.getTime();
  }).length;

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const hearingsByDate = useMemo(() => {
    const map = new Map<string, number>();

    filtered.forEach((hearing) => {
      const date = new Date(hearing.hearingDate);
      if (
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
      ) {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    });

    return map;
  }, [filtered, currentMonth]);

  const selectedDateHearings = useMemo(() => {
    if (!selectedDate) return [];

    return filtered
      .filter((h) => isSameDay(new Date(h.hearingDate), selectedDate))
      .sort(
        (a, b) =>
          new Date(a.hearingDate).getTime() -
          new Date(b.hearingDate).getTime(),
      );
  }, [filtered, selectedDate]);

  const groupedHearings = useMemo(() => {
    const source = selectedDate ? selectedDateHearings : filtered;

    return source.reduce((acc, hearing) => {
      const court =
        hearing.courtRoom ||
        hearing.matter?.court ||
        (hindi ? "न्यायालय आवंटित नहीं" : "Court Not Assigned");

      if (!acc[court]) acc[court] = [];
      acc[court].push(hearing);
      return acc;
    }, {} as Record<string, Hearing[]>);
  }, [filtered, selectedDate, selectedDateHearings, hindi]);

  const openReschedule = (hearing: Hearing) => {
    setSelectedHearing(hearing);
    setShowReschedule(true);
  };

  const openPreparation = (hearing: Hearing) => {
    setSelectedHearing(hearing);
    setShowPreparation(true);
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const moveMonth = (offset: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {hindi ? "सुनवाई" : "Hearings"}
              </h1>
              <p className="mt-1 text-slate-500">
                {hindi
                  ? "आगामी न्यायालय सुनवाई और चरणों का प्रबंधन करें।"
                  : "Track upcoming court hearings, cause lists and hearing stages."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewHearing(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={18} />
                {hindi ? "नई सुनवाई" : "New Hearing"}
              </button>
              <UserMenu />
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-600">
                {hindi ? "आज की सुनवाई" : "Today's Hearings"}
              </p>
              <h2 className="mt-2 text-4xl font-bold text-red-700">
                {todaysCount}
              </h2>
              <p className="mt-1 text-sm text-red-600/80">
                {hindi ? "आज लंबित" : "Pending today"}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-sm font-medium text-blue-600">
                {hindi ? "आगामी" : "Upcoming"}
              </p>
              <h2 className="mt-2 text-4xl font-bold text-blue-700">
                {upcomingCount}
              </h2>
              <p className="mt-1 text-sm text-blue-600/80">
                {hindi ? "आज के बाद" : "After today"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600">
                {hindi ? "पूर्ण" : "Completed"}
              </p>
              <h2 className="mt-2 text-4xl font-bold text-slate-800">
                {completedCount}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {hindi ? "पूर्ण या पिछली" : "Completed or past"}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Search className="shrink-0 text-slate-400" size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  hindi ? "सुनवाई खोजें..." : "Search hearings, matters, courts..."
                }
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={hindi ? "खोज साफ करें" : "Clear search"}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {hindi ? "आज" : "Today"}
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  {hindi ? "सभी तारीखें" : "All dates"}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl bg-white p-5 shadow-sm lg:p-6">
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="rounded-lg border border-slate-300 p-2.5 text-slate-700 transition hover:bg-slate-50"
                  aria-label={hindi ? "पिछला महीना" : "Previous month"}
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {currentMonth.toLocaleDateString(hindi ? "hi-IN" : "en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {hindi ? "तारीख चुनें" : "Select a date to view hearings"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="rounded-lg border border-slate-300 p-2.5 text-slate-700 transition hover:bg-slate-50"
                  aria-label={hindi ? "अगला महीना" : "Next month"}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="mb-3 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
                {(hindi ? WEEK_DAYS_HI : WEEK_DAYS_EN).map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div key={`empty-${index}`} className="aspect-square rounded-xl" />
                    );
                  }

                  const date = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day,
                  );
                  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  const hearingCount = hearingsByDate.get(dateKey) ?? 0;
                  const isToday = isSameDay(date, today);
                  const isSelected = selectedDate !== null && isSameDay(date, selectedDate);

                  return (
                    <button
                      type="button"
                      key={`day-${day}`}
                      onClick={() => setSelectedDate(date)}
                      className={`relative aspect-square rounded-xl border p-2 text-left transition sm:p-3 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-md"
                          : isToday
                            ? "border-blue-500 bg-blue-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <span className="text-sm font-semibold">{day}</span>
                      {hearingCount > 0 && (
                        <span
                          className={`absolute bottom-2 right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                            isSelected ? "bg-white text-blue-700" : "bg-blue-600 text-white"
                          }`}
                        >
                          {hearingCount}
                        </span>
                      )}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  {hindi ? "सुनवाई" : "Hearing"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-200 ring-2 ring-blue-500" />
                  {hindi ? "आज" : "Today"}
                </div>
              </div>
            </section>

            <div className="space-y-5">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedDate
                        ? formatDate(selectedDate, hindi)
                        : hindi
                          ? "आज की कॉज़ लिस्ट"
                          : "Today's Cause List"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {(selectedDate ? selectedDateHearings : todaysHearings).length} {hindi ? "सुनवाई" : "hearing(s)"}
                    </p>
                  </div>
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {hindi ? "साफ करें" : "Clear"}
                    </button>
                  )}
                </div>

                {(selectedDate ? selectedDateHearings : todaysHearings).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <CalendarDays className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-sm text-slate-500">
                      {hindi ? "इस तारीख पर कोई सुनवाई नहीं है।" : "No hearings on this date."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selectedDate ? selectedDateHearings : todaysHearings).map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {h.matter?.title || (hindi ? "अज्ञात मामला" : "Unknown Matter")}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">{h.stage}</div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                              h.isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {h.isCompleted ? (hindi ? "पूर्ण" : "Completed") : formatTime(h.hearingDate, hindi)}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                          {h.judgeName && (
                            <span className="flex items-center gap-1">
                              <Gavel size={14} />
                              {h.judgeName}
                            </span>
                          )}
                          {(h.courtRoom || h.matter?.court) && (
                            <span>{h.courtRoom || h.matter?.court}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {hindi ? "कल की सुनवाई" : "Tomorrow"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(tomorrowDate, hindi)}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {tomorrowHearings.length}
                  </span>
                </div>

                {tomorrowHearings.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    {hindi ? "कल कोई सुनवाई नहीं है।" : "No hearings tomorrow."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tomorrowHearings.map((h) => (
                      <div key={h.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="font-semibold text-slate-900">
                          {h.matter?.title || (hindi ? "अज्ञात मामला" : "Unknown Matter")}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <Clock3 size={15} />
                          {formatTime(h.hearingDate, hindi)}
                        </div>
                        <div className="mt-2 text-sm text-amber-700">{h.stage}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedDate
                    ? `${hindi ? "सुनवाई" : "Hearings"} — ${formatDate(selectedDate, hindi)}`
                    : hindi
                      ? "सभी सुनवाई"
                      : "All Hearings"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDate ? selectedDateHearings.length : filtered.length} {hindi ? "सुनवाई मिली" : "hearing(s) found"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
                {hindi ? "लोड हो रहा है..." : "Loading hearings..."}
              </div>
            ) : Object.keys(groupedHearings).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <Gavel className="mx-auto mb-3 text-slate-400" size={30} />
                <h3 className="font-semibold text-slate-800">
                  {hindi ? "कोई सुनवाई नहीं मिली" : "No hearings found"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {search
                    ? hindi
                      ? "अपनी खोज बदलकर फिर प्रयास करें।"
                      : "Try changing your search."
                    : hindi
                      ? "नई सुनवाई जोड़कर शुरुआत करें।"
                      : "Create a new hearing to get started."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setShowNewHearing(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    {hindi ? "नई सुनवाई" : "New Hearing"}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedHearings).map(([court, list]) => (
                  <div
                    key={court}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b bg-slate-50 px-5 py-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <Gavel size={17} className="text-slate-500" />
                        {court}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {list.map((hearing) => {
                        const hearingDate = new Date(hearing.hearingDate);
                        const isPast = startOfDay(hearingDate).getTime() < today.getTime();
                        const completed = Boolean(hearing.isCompleted) || isPast;

                        return (
                          <div
                            key={hearing.id}
                            className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="flex min-w-0 items-start gap-4">
                              <div
                                className={`shrink-0 rounded-xl p-3 ${
                                  completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                <Gavel size={22} />
                              </div>

                              <div className="min-w-0">
                                <h3 className="truncate text-lg font-semibold text-slate-900">
                                  {hearing.matter?.title || (hindi ? "अज्ञात मामला" : "Unknown Matter")}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">{hearing.stage}</p>

                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays size={16} />
                                    {formatDate(hearingDate, hindi)}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock3 size={16} />
                                    {formatTime(hearing.hearingDate, hindi)}
                                  </div>
                                  {hearing.matter?.matterNumber && (
                                    <span>
                                      {hindi ? "मामला" : "Matter"}: {hearing.matter.matterNumber}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                                  {hearing.judgeName && (
                                    <span className="flex items-center gap-1.5">
                                      <Gavel size={15} />
                                      {hearing.judgeName}
                                    </span>
                                  )}
                                  {(hearing.courtRoom || hearing.matter?.court) && (
                                    <span>{hearing.courtRoom || hearing.matter?.court}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                              <span
                                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                                  completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {completed ? (hindi ? "पूर्ण" : "Completed") : hindi ? "आगामी" : "Upcoming"}
                              </span>

                              {!completed && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await api.put(`/Hearings/${hearing.id}/complete`);
                                      await loadHearings();
                                    } catch (err) {
                                      console.error("Failed to mark hearing attended:", err);
                                    }
                                  }}
                                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                >
                                  {hindi ? "उपस्थित" : "Mark Attended"}
                                </button>
                              )}

                              {!completed && (
                                <button
                                  type="button"
                                  onClick={() => openPreparation(hearing)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                  <Sparkles size={16} />
                                  {hindi ? "सुनवाई तैयार करें" : "Prepare Hearing"}
                                </button>
                              )}

                              {!completed && (
                                <button
                                  type="button"
                                  onClick={() => openReschedule(hearing)}
                                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  {hindi ? "पुनर्निर्धारित" : "Reschedule"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedHearing && (
            <HearingPreparationPanel
              open={showPreparation}
              hearing={selectedHearing}
              onClose={() => {
                setShowPreparation(false);
                setSelectedHearing(null);
              }}
            />
          )}

          <NewHearingModal
            open={showNewHearing}
            onClose={() => setShowNewHearing(false)}
            onCreated={loadHearings}
          />

          <RescheduleHearingModal
            open={showReschedule}
            hearingId={selectedHearing?.id ?? null}
            currentDate={selectedHearing?.hearingDate ?? ""}
            onClose={() => {
              setShowReschedule(false);
              setSelectedHearing(null);
            }}
            onUpdated={() => {
              setShowReschedule(false);
              setSelectedHearing(null);
              loadHearings();
            }}
          />
        </main>
      </div>
    </div>
  );
}
