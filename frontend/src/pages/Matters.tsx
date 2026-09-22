import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Scale } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";

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
          m.court.toLowerCase().includes(term)
      )
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Matters</h1>
              <p className="text-slate-500">
                Manage all court matters and legal cases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
                <Plus size={18} />
                New Matter
              </button>

              <UserMenu />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search matters..."
              className="w-full outline-none"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center">
                Loading matters...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                No matters found.
              </div>
            ) : (
              filtered.map((matter) => (
                <Link
                  key={matter.id}
                  to={`/matters/${matter.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                          <Scale size={22} />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {matter.title}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {matter.matterNumber}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                        <div>
                          <span className="font-medium">Client:</span>{" "}
                          {matter.client?.fullName || "—"}
                        </div>

                        <div>
                          <span className="font-medium">Court:</span>{" "}
                          {matter.court}
                        </div>

                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {matter.matterType}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(
                        matter.status
                      )}`}
                    >
                      {matter.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}