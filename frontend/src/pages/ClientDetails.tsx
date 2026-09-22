import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Scale, CalendarDays, FileText } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";

interface Client {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  notes: string;
}

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    return <div className="flex items-center justify-center min-h-screen">Loading client...</div>;
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Client not found."}</p>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate("/clients")}
                className="mb-3 flex items-center gap-2 text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <h1 className="text-3xl font-bold text-slate-900">{client.fullName}</h1>
              <p className="text-slate-500">Client Profile</p>
            </div>

            <UserMenu />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold">Contact Information</h2>

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
        </main>
      </div>
    </div>
  );
}