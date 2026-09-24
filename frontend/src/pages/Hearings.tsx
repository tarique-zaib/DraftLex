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

          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            {i18n.language.startsWith("hi")
              ? "आगामी सुनवाई"
              : "Upcoming Hearings"}
          </h2>

          {loading ? (
            <div className="rounded-xl bg-white p-10 text-center">
              {i18n.language.startsWith("hi")
                ? "लोड हो रहा है..."
                : "Loading..."}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([court, list]) => (
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
