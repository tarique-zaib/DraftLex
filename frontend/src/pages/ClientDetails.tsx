import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Scale,
  CalendarDays,
  FileText,
} from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import EditClientModal from "../components/EditClientModal";

interface Client {
  id: string;
  clientCode?: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  notes?: string;
}

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [matters, setMatters] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab !== "matters") return;

    api
      .get(`/Clients/${id}/matters`)
      .then((r) => setMatters(r.data))
      .catch(console.error);
  }, [activeTab, id]);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const { data } = await api.get(`/Clients/${id}`);
      setClient(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load client.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading client...
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || "Client not found."}</p>
          <button
            onClick={() => navigate("/clients")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate("/clients")}
                className="mb-3 flex items-center gap-2 text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <h1 className="text-3xl font-bold text-slate-900">
                {client.fullName}
              </h1>

              <p className="mt-1 text-slate-500">
                {client.clientCode} • Client Profile
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEdit(true)}
                className="rounded-lg border px-4 py-2 hover:bg-slate-50"
              >
                Edit Client
              </button>

              <UserMenu />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 rounded-xl border bg-white p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto">
              {[
                ["overview", "Overview"],
                ["matters", "Matters"],
                ["hearings", "Hearings"],
                ["documents", "Documents"],
                ["timeline", "Timeline"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`rounded-lg px-4 py-2 whitespace-nowrap transition ${
                    activeTab === key
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-semibold">
                  Contact Information
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="text-blue-600" size={20} />
                    <span>{client.mobile || "-"}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="text-blue-600" size={20} />
                    <span>{client.email || "-"}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="text-blue-600" size={20} />
                    <span>{client.address || "-"}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="mb-3 text-lg font-semibold">Notes</h3>
                  <div className="rounded-lg border bg-slate-50 p-4">
                    {client.notes || "No notes added."}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-semibold">Quick Actions</h2>

                <div className="space-y-3">
                  <Link
                    to="/matters"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <Scale size={20} />
                    New Matter
                  </Link>

                  <Link
                    to="/hearings"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <CalendarDays size={20} />
                    Schedule Hearing
                  </Link>

                  <Link
                    to="/ai-drafts"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <FileText size={20} />
                    Generate Draft
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Matters */}
          {activeTab === "matters" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Client Matters</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="py-3">Matter No</th>
                      <th className="py-3">Title</th>
                      <th className="py-3">Court</th>
                      <th className="py-3">Status</th>
                      <th className="py-3"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {matters.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-slate-500"
                        >
                          No matters found.
                        </td>
                      </tr>
                    ) : (
                      matters.map((m) => (
                        <tr key={m.id} className="border-b">
                          <td className="py-4">{m.matterNumber}</td>

                          <td>{m.title}</td>

                          <td>{m.court}</td>

                          <td>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                              {m.status}
                            </span>
                          </td>

                          <td>
                            <Link
                              to={`/matters/${m.id}`}
                              className="text-blue-600 hover:underline"
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
            </div>
          )}

          {/* Hearings */}
          {activeTab === "hearings" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Hearings</h2>
              <p className="text-slate-500">
                Upcoming and past hearings will appear here.
              </p>
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Documents</h2>
              <p className="text-slate-500">
                AI drafts and legal documents will appear here.
              </p>
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Activity Timeline</h2>
              <p className="text-slate-500">
                Client activity history will appear here.
              </p>
            </div>
          )}

          <EditClientModal
            open={showEdit}
            client={client}
            onClose={() => setShowEdit(false)}
            onUpdated={loadClient}
          />
        </main>
      </div>
    </div>
  );
}
