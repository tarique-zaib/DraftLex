import { useEffect, useState } from "react";
import { CalendarDays, Plus, Search, Gavel } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import NewHearingModal from "../components/NewHearingModal";

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

export default function Hearings() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [filtered, setFiltered] = useState<Hearing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewHearing, setShowNewHearing] = useState(false);

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

          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hearings..."
              className="w-full outline-none"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center">
                Loading hearings...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                No hearings found.
              </div>
            ) : (
              filtered.map((hearing) => (
                <div
                  key={hearing.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                          <Gavel size={22} />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {hearing.stage}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {hearing.matter?.title || "Unknown Matter"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                        <div>
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(hearing.hearingDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>

                        <div>
                          <span className="font-medium">Judge:</span>{" "}
                          {hearing.judgeName || "TBD"}
                        </div>

                        <div>
                          <span className="font-medium">Court Room:</span>{" "}
                          {hearing.courtRoom || "TBD"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                      Upcoming
                    </div>
                  </div>
                </div>
              ))
            )}
            <NewHearingModal
              open={showNewHearing}
              onClose={() => setShowNewHearing(false)}
              onCreated={loadHearings}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
