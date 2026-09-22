import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Phone, User } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";

interface Client {
  id: string;
  clientCode: string;
  fullName: string;
  mobile: string;
  email?: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();

    setFiltered(
      clients.filter(
        (c) =>
          c.fullName.toLowerCase().includes(term) ||
          c.clientCode.toLowerCase().includes(term) ||
          c.mobile.includes(term)
      )
    );
  }, [search, clients]);

  const loadClients = async () => {
    try {
      const { data } = await api.get<Client[]>("/Clients");
      setClients(data);
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
              <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
              <p className="text-slate-500">
                Manage all your clients in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
                <Plus size={18} />
                New Client
              </button>

              <UserMenu />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Search className="text-slate-400" size={20} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code or mobile..."
              className="w-full outline-none"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left">Client</th>
                  <th className="px-6 py-4 text-left">Code</th>
                  <th className="px-6 py-4 text-left">Mobile</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => (
                    <tr key={client.id} className="border-t hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                            <User size={18} />
                          </div>

                          <div>
                            <div className="font-semibold">
                              {client.fullName}
                            </div>

                            <div className="text-sm text-slate-500">
                              {client.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">{client.clientCode}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          {client.mobile}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/clients/${client.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}