import { useEffect, useMemo, useState } from "react";
import { Search, CalendarDays, Gavel, Clock3, Plus } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import NewHearingModal from "../components/NewHearingModal";
import i18n from "../i18n";
import RescheduleHearingModal from "../components/RescheduleHearingModal";

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

export default function Hearings() {
  const [, setLang] = useState(i18n.language);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewHearing, setShowNewHearing] = useState(false);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );

  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  const loadHearings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/Hearings");
      setHearings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHearings();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return hearings.filter(
      (h) =>
        h.matter?.title?.toLowerCase().includes(term) ||
        h.matter?.matterNumber?.toLowerCase().includes(term) ||
        h.stage.toLowerCase().includes(term) ||
        h.judgeName?.toLowerCase().includes(term),
    );
  }, [hearings, search]);

  const today = new Date().toDateString();

  const todaysCount = filtered.filter(
    (h) => new Date(h.hearingDate).toDateString() === today,
  ).length;

  const upcomingCount = filtered.filter(
    (h) => new Date(h.hearingDate) > new Date(),
  ).length;

  const completedCount = filtered.filter(
    (h) => new Date(h.hearingDate) < new Date(),
  ).length;

  const grouped = filtered.reduce(
    (acc, hearing) => {
      const key =
        hearing.courtRoom ||
        hearing.matter?.court ||
        (i18n.language.startsWith("hi")
          ? "न्यायालय आवंटित नहीं"
          : "Court Not Assigned");

      acc[key] = [...(acc[key] || []), hearing];
      return acc;
    },
    {} as Record<string, Hearing[]>,
  );

  const daysInMonth = endOfMonth.getDate();
  const firstDay = startOfMonth.getDay();

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayDate = new Date().toDateString();

  const todaysHearings = filtered.filter(
    (h) =>
      new Date(h.hearingDate).toDateString() === todayDate &&
      !h.isCompleted,
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowHearings = filtered.filter(
    (h) =>
      new Date(h.hearingDate).toDateString() === tomorrow.toDateString() &&
      !completedIds.includes(h.id),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {i18n.language.startsWith("hi") ? "सुनवाई" : "Hearings"}
              </h1>

              <p className="text-slate-500">
                {i18n.language.startsWith("hi")
                  ? "आगामी न्यायालय सुनवाई और चरणों का प्रबंधन करें।"
                  : "Track upcoming court hearings and stages."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewHearing(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                {i18n.language.startsWith("hi") ? "नई सुनवाई" : "New Hearing"}
              </button>

              <UserMenu />
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-red-600">
                {i18n.language.startsWith("hi")
                  ? "आज की सुनवाई"
                  : "Today's Hearings"}
              </p>
              <h2 className="mt-2 text-4xl font-bold text-red-700">
                {todaysCount}
              </h2>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-blue-600">
                {i18n.language.startsWith("hi") ? "आगामी" : "Upcoming"}
              </p>
              <h2 className="mt-2 text-4xl font-bold text-blue-700">
                {upcomingCount}
              </h2>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600">
                {i18n.language.startsWith("hi") ? "पूर्ण" : "Completed"}
              </p>
              <h2 className="mt-2 text-4xl font-bold text-slate-800">
                {completedCount}
              </h2>
            </div>
          </div>

          <div className="mb-8 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                i18n.language.startsWith("hi")
                  ? "सुनवाई खोजें..."
                  : "Search hearings..."
              }
              className="w-full outline-none"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* LEFT - Calendar */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                >
                  ←
                </button>

                <h2 className="text-xl font-bold">
                  {currentMonth.toLocaleDateString(
                    i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
                    { month: "long", year: "numeric" },
                  )}
                </h2>

                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                >
                  →
                </button>
              </div>

              <div className="mb-3 grid grid-cols-7 text-center text-sm font-semibold text-slate-500">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  if (!day)
                    return (
                      <div key={`empty-${idx}`} className="aspect-square" />
                    );

                  const isToday =
                    day === new Date().getDate() &&
                    currentMonth.getMonth() === new Date().getMonth() &&
                    currentMonth.getFullYear() === new Date().getFullYear();

                  const hearingCount = filtered.filter((h) => {
                    const d = new Date(h.hearingDate);
                    return (
                      d.getDate() === day &&
                      d.getMonth() === currentMonth.getMonth() &&
                      d.getFullYear() === currentMonth.getFullYear()
                    );
                  }).length;

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() =>
                        setSelectedDate(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            day,
                          ),
                        )
                      }
                      className={`relative aspect-square cursor-pointer rounded-xl border p-3 transition ${
                        selectedDate &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === currentMonth.getMonth() &&
                        selectedDate.getFullYear() ===
                          currentMonth.getFullYear()
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                          : isToday
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <span className="absolute left-3 top-2 text-sm font-semibold">
                        {day}
                      </span>

                      {hearingCount > 0 && (
                        <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                          {hearingCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT - Cause List */}
            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">
                  {i18n.language.startsWith("hi")
                    ? "आज की कॉज़ लिस्ट"
                    : "Today's Cause List"}
                </h3>

                {todaysHearings.length === 0 ? (
                  <p className="text-slate-500">
                    {i18n.language.startsWith("hi")
                      ? "आज कोई सुनवाई नहीं है।"
                      : "No hearings today."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todaysHearings.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl border border-red-200 bg-red-50 p-4"
                      >
                        <div className="font-semibold">{h.matter?.title}</div>

                        <div className="mt-1 text-sm text-slate-600">
                          {new Date(h.hearingDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="mt-2 text-sm text-red-700">
                          {h.stage}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">
                  {i18n.language.startsWith("hi") ? "कल की सुनवाई" : "Tomorrow"}
                </h3>

                {tomorrowHearings.length === 0 ? (
                  <p className="text-slate-500">
                    {i18n.language.startsWith("hi")
                      ? "कल कोई सुनवाई नहीं है।"
                      : "No hearings tomorrow."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tomorrowHearings.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div className="font-semibold">{h.matter?.title}</div>

                        <div className="mt-1 text-sm text-slate-600">
                          {new Date(h.hearingDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="mt-2 text-sm text-amber-700">
                          {h.stage}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Existing grouped hearing list */}
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              {i18n.language.startsWith("hi") ? "सभी सुनवाई" : "All Hearings"}
            </h2>

            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center">
                {i18n.language.startsWith("hi")
                  ? "लोड हो रहा है..."
                  : "Loading..."}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  selectedDate
                    ? filtered
                        .filter(
                          (h) =>
                            new Date(h.hearingDate).toDateString() ===
                            selectedDate.toDateString(),
                        )
                        .reduce(
                          (acc, hearing) => {
                            (acc[hearing.matter?.court || "Unknown Court"] ??=
                              []).push(hearing);
                            return acc;
                          },
                          {} as Record<string, Hearing[]>,
                        )
                    : grouped,
                ).map(([court, list]) => (
                  <div
                    key={court}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b bg-slate-50 px-6 py-4 font-semibold">
                      {court}
                    </div>

                    {list.map((hearing) => (
                      <div
                        key={hearing.id}
                        className="flex items-center justify-between border-b p-6 last:border-b-0"
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
                            <Gavel size={24} />
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold">
                              {hearing.matter?.title}
                            </h3>

                            <p className="text-slate-500">{hearing.stage}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hearing.isCompleted ? (
                            <span className="rounded-full bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
                              {i18n.language.startsWith("hi")
                                ? "पूर्ण"
                                : "Completed"}
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await api.put(
                                    `/Hearings/${hearing.id}/complete`,
                                  );
                                  await loadHearings();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                            >
                              {i18n.language.startsWith("hi")
                                ? "उपस्थित"
                                : "Mark Attended"}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedHearing(hearing);
                              setShowReschedule(true);
                            }}
                            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
                          >
                            {i18n.language.startsWith("hi")
                              ? "पुनर्निर्धारित करें"
                              : "Reschedule"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl bg-white p-10 text-center">
              {i18n.language.startsWith("hi")
                ? "लोड हो रहा है..."
                : "Loading..."}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                selectedDate
                  ? filtered
                      .filter(
                        (h) =>
                          new Date(h.hearingDate).toDateString() ===
                          selectedDate.toDateString(),
                      )
                      .reduce(
                        (acc, hearing) => {
                          (acc[hearing.matter?.court || "Unknown Court"] ??=
                            []).push(hearing);
                          return acc;
                        },
                        {} as Record<string, Hearing[]>,
                      )
                  : grouped,
              ).map(([court, list]) => (
                <div
                  key={court}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b bg-slate-50 px-6 py-4 font-semibold">
                    {court}
                  </div>

                  {list.map((hearing) => (
                    <div
                      key={hearing.id}
                      className="flex items-center justify-between border-b last:border-b-0 p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-blue-100 p-4 text-blue-600">
                          <Gavel size={24} />
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold">
                            {hearing.matter?.title ||
                              (i18n.language.startsWith("hi")
                                ? "अज्ञात मामला"
                                : "Unknown Matter")}
                          </h3>

                          <p className="text-slate-500">{hearing.stage}</p>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <CalendarDays size={16} />
                              {new Date(hearing.hearingDate).toLocaleDateString(
                                i18n.language.startsWith("hi")
                                  ? "hi-IN"
                                  : "en-IN",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Clock3 size={16} />
                              {new Date(hearing.hearingDate).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                            <Gavel size={16} />
                            {hearing.judgeName ||
                              (i18n.language.startsWith("hi")
                                ? "न्यायाधीश निर्धारित नहीं"
                                : "Judge TBD")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                          {new Date(hearing.hearingDate) > new Date()
                            ? i18n.language.startsWith("hi")
                              ? "आगामी"
                              : "Upcoming"
                            : i18n.language.startsWith("hi")
                              ? "पूर्ण"
                              : "Completed"}
                        </span>

                        {/* FIXED BUTTON */}
                        <button
                          onClick={() => {
                            setSelectedHearing(hearing);
                            setShowReschedule(true);
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
                        >
                          {i18n.language.startsWith("hi")
                            ? "पुनर्निर्धारित करें"
                            : "Reschedule"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
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
            onClose={() => setShowReschedule(false)}
            onUpdated={loadHearings}
          />
        </main>
      </div>
    </div>
  );
}
