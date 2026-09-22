import { useEffect, useState } from "react";
import { Users, Scale, CalendarDays, FileText } from "lucide-react";
import { api } from "./api/client";
import "./index.css";

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
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

export default function App() {
  const [stats, setStats] = useState({
    clients: 0,
    matters: 0,
    hearings: 0,
    documents: 0,
  });
  const [matters, setMatters] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [clientsRes, mattersRes, hearingsRes] = await Promise.all([
          api.get("/Clients"),
          api.get("/Matters"),
          api.get("/Hearings"),
        ]);

        setMatters(mattersRes.data.slice(0, 5));
        setHearings(hearingsRes.data.slice(0, 5));

        setStats({
          clients: clientsRes.data.length,
          matters: mattersRes.data.length,
          hearings: hearingsRes.data.length,
          documents: 0,
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
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
          <h1 className="text-2xl font-bold text-blue-400">DraftLex</h1>
          <p className="text-sm text-slate-400 mt-1">Advocate Workspace</p>

          <nav className="mt-10 space-y-2">
            {[
              "Dashboard",
              "Clients",
              "Matters",
              "Hearings",
              "Documents",
              "AI Drafts",
            ].map((item) => (
              <button
                key={item}
                className="w-full rounded-lg px-4 py-3 text-left hover:bg-slate-800"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome, Advocate
              </h1>
              <p className="text-slate-500">
                Manage clients, matters and AI legal drafts.
              </p>
            </div>

            <button className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
              + Generate AI Draft
            </button>
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Clients"
              value={stats.clients.toString()}
              icon={<Users size={24} />}
            />

            <StatCard
              title="Active Matters"
              value={stats.matters.toString()}
              icon={<Scale size={24} />}
            />

            <StatCard
              title="Hearings"
              value={stats.hearings.toString()}
              icon={<CalendarDays size={24} />}
            />

            <StatCard
              title="AI Documents"
              value={stats.documents.toString()}
              icon={<FileText size={24} />}
            />
          </div>

          {/* Two-column section */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-4 text-xl font-semibold">Recent Matters</h2>

              <div className="space-y-3">
                {matters.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    No matters yet.
                  </div>
                ) : (
                  matters.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
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
                        {m.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="mb-4 text-xl font-semibold">Upcoming Hearings</h2>

              <div className="space-y-3">
                {hearings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    No hearings scheduled.
                  </div>
                ) : (
                  hearings.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {h.stage}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(h.hearingDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {h.judgeName || "Judge TBD"} •{" "}
                          {h.courtRoom || "Court TBD"}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        Upcoming
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
