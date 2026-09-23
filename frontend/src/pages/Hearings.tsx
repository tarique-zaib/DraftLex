import { useEffect, useState } from "react";
import { CalendarDays, Plus, Search, Gavel } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import NewHearingModal from "../components/NewHearingModal";
import RescheduleHearingModal from "../components/RescheduleHearingModal";

interface Hearing {
  id: string;
  hearingDate: string;
  stage: string;
  judgeName?: string;
  courtRoom?: string;
  matter?: {
    title: string;
    matterNumber: string;
  };
}

const getHearingStatus = (hearingDate: string) => {
  const hearing = new Date(hearingDate);
  const today = new Date();

  hearing.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (hearing.getTime() === today.getTime()) return "Today";
  if (hearing > today) return "Upcoming";
  return "Completed";
};

export default function Hearings() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [filtered, setFiltered] = useState<Hearing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewHearing, setShowNewHearing] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);

  useEffect(() => {
    loadHearings();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();

    setFiltered(
      hearings.filter(
        (h) =>
          h.stage.toLowerCase().includes(term) ||
          (h.matter?.title ?? "").toLowerCase().includes(term) ||
          (h.judgeName ?? "").toLowerCase().includes(term),
      ),
    );
  }, [search, hearings]);

  const loadHearings = async () => {
    try {
      const { data } = await api.get<Hearing[]>("/Hearings");
      setHearings(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayCount = hearings.filter(
    (h) => getHearingStatus(h.hearingDate) === "Today",
  ).length;

  const upcomingCount = hearings.filter(
    (h) => getHearingStatus(h.hearingDate) === "Upcoming",
  ).length;

  const completedCount = hearings.filter(
    (h) => getHearingStatus(h.hearingDate) === "Completed",
  ).length;

  const groupedHearings = filtered.reduce(
    (acc, hearing) => {
      const status = getHearingStatus(hearing.hearingDate);

      const court = hearing.courtRoom || "Court Not Assigned";

      if (!acc[status]) acc[status] = {};

      if (!acc[status][court]) acc[status][court] = [];

      acc[status][court].push(hearing);

      acc[status][court].sort(
        (a, b) =>
          new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime(),
      );

      return acc;
    },
    {} as Record<string, Record<string, Hearing[]>>,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Hearings</h1>
              <p className="text-slate-500">
                Track upcoming court hearings and stages.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewHearing(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                New Hearing
              </button>

              <UserMenu />
            </div>
          </div>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm text-red-700">Today's Hearings</p>
              <h2 className="mt-1 text-3xl font-bold text-red-700">
                {todayCount}
              </h2>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm text-blue-700">Upcoming</p>
              <h2 className="mt-1 text-3xl font-bold text-blue-700">
                {upcomingCount}
              </h2>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-100 p-5">
              <p className="text-sm text-slate-700">Completed</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-700">
                {completedCount}
              </h2>
            </div>
          </div>
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hearings..."
              className="w-full outline-none"
            />
          </div>

          <div className="space-y-8">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center">
                Loading hearings...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                No hearings found.
              </div>
            ) : (
              ["Today", "Upcoming", "Completed"].map((section) => {
                const courts = groupedHearings[section];

                if (!courts) return null;

                return (
                  <div key={section}>
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">
                      {section === "Today"
                        ? "Today's Cause List"
                        : `${section} Hearings`}
                    </h2>

                    <div className="space-y-6">
                      {Object.entries(courts).map(([court, items]) => (
                        <div
                          key={court}
                          className="rounded-xl border bg-white shadow-sm"
                        >
                          <div className="border-b bg-slate-50 px-5 py-3">
                            <h3 className="font-semibold">{court}</h3>
                          </div>

                          <div className="divide-y">
                            {items.map((hearing) => {
                              const status = getHearingStatus(
                                hearing.hearingDate,
                              );

                              return (
                                <div
                                  key={hearing.id}
                                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                                      <Gavel size={20} />
                                    </div>

                                    <div>
                                      <p className="font-semibold">
                                        {hearing.matter?.title ||
                                          "Unknown Matter"}
                                      </p>

                                      <p className="text-sm text-slate-500">
                                        {hearing.stage}
                                      </p>

                                      <p className="text-sm text-slate-500">
                                        {new Date(
                                          hearing.hearingDate,
                                        ).toLocaleTimeString("en-IN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`rounded-full px-3 py-1 text-sm ${
                                        status === "Today"
                                          ? "bg-red-100 text-red-700"
                                          : status === "Upcoming"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {status}
                                    </span>

                                    <button
                                      onClick={() => {
                                        setSelectedHearing(hearing);
                                        setShowReschedule(true);
                                      }}
                                      className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
                                    >
                                      Reschedule
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
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
          </div>
        </main>
      </div>
    </div>
  );
}
