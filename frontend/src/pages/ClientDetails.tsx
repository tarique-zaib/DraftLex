import i18n from "../i18n";
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

interface ClientDocument {
  id: string;
  matterId: string;
  matterTitle: string;
  title: string;
  documentType: string;
  version: number;
  status: string;
  updatedAt: string;
}

interface ClientTimeline {
  date: string;
  type: "Client" | "Matter" | "Hearing" | "Document";
  title: string;
  description: string;
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
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [timeline, setTimeline] = useState<ClientTimeline[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  interface ClientHearing {
    id: string;
    matterId: string;
    matterTitle: string;
    hearingDate: string;
    stage: string;
    judgeName: string;
    courtRoom: string;
  }

  const [hearings, setHearings] = useState<ClientHearing[]>([]);
  const [loadingHearings, setLoadingHearings] = useState(false);

  useEffect(() => {
    if (activeTab !== "timeline" || !id) return;

    const loadTimeline = async () => {
      try {
        setLoadingTimeline(true);
        const { data } = await api.get(`/Clients/${id}/timeline`);
        setTimeline(data);
      } catch (err) {
        console.error("Failed to load timeline", err);
      } finally {
        setLoadingTimeline(false);
      }
    };

    loadTimeline();
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "documents" || !id) return;

    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const { data } = await api.get(`/Clients/${id}/documents`);
        setDocuments(data);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "hearings" || !id) return;

    const loadHearings = async () => {
      try {
        setLoadingHearings(true);
        const { data } = await api.get(`/Clients/${id}/hearings`);
        setHearings(data);
      } finally {
        setLoadingHearings(false);
      }
    };

    loadHearings();
  }, [activeTab, id]);

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
            {i18n.t("back")}
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
                {client.clientCode} • {i18n.t("clientProfile")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEdit(true)}
                className="rounded-lg border px-4 py-2 hover:bg-slate-50"
              >
                {i18n.t("editClient")}
              </button>

              <UserMenu />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 rounded-xl border bg-white p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto">
              {[
                ["overview", i18n.t("overview")],
                ["matters", i18n.t("matters")],
                ["hearings", i18n.t("hearings")],
                ["documents", i18n.t("documents")],
                ["timeline", i18n.t("timeline")],
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
                  {i18n.t("contactInformation")}
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
                    {client.notes || i18n.t("noNotes")}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-semibold">
                  {i18n.t("quickActions")}
                </h2>

                <div className="space-y-3">
                  <Link
                    to="/matters"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <Scale size={20} />
                    {i18n.t("newMatter")}
                  </Link>

                  <Link
                    to="/hearings"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <CalendarDays size={20} />
                    {i18n.t("scheduleHearing")}
                  </Link>

                  <Link
                    to="/ai-drafts"
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <FileText size={20} />
                    {i18n.t("generateDraft")}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Matters */}
          {activeTab === "matters" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">
                <h3>{i18n.t("clientMatters")}</h3>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="py-3">{i18n.t("matterNo")}</th>
                      <th className="py-3">{i18n.t("title")}</th>
                      <th className="py-3">{i18n.t("court")}</th>
                      <th className="py-3">{i18n.t("status")}</th>
                      <th className="py-3">{i18n.t("actions")}</th>
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
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {i18n.t("clientHearings")}
                </h2>

                <Link
                  to="/hearings"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  + {i18n.t("scheduleHearing")}
                </Link>
              </div>

              {loadingHearings ? (
                <div className="py-8 text-center text-slate-500">
                  Loading hearings...
                </div>
              ) : hearings.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                  No hearings found.
                </div>
              ) : (
                <div className="space-y-3">
                  {hearings.map((h) => {
                    const date = new Date(h.hearingDate);

                    const today = new Date();

                    const isToday =
                      date.toDateString() === today.toDateString();

                    const isPast = date < today && !isToday;

                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-semibold">{h.matterTitle}</p>

                          <p className="text-sm text-slate-500">
                            {h.stage === "First Hearing"
                              ? i18n.t("firstHearing")
                              : h.stage === "Evidence"
                                ? i18n.t("evidence")
                                : h.stage === "Arguments"
                                  ? i18n.t("arguments")
                                  : h.stage === "Cross Examination"
                                    ? i18n.t("crossExamination")
                                    : i18n.t("finalOrder")}
                          </p>

                          <p className="text-sm text-slate-500">
                            {date.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>

                          <p className="text-xs text-slate-400">
                            {h.judgeName} • {h.courtRoom}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm ${
                            isToday
                              ? "bg-red-100 text-red-700"
                              : isPast
                                ? "bg-gray-200 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isToday
                            ? i18n.t("today")
                            : isPast
                              ? i18n.t("completed")
                              : i18n.t("upcoming")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {i18n.t("clientDocuments")}
                </h2>

                <Link
                  to="/ai-drafts"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  + {i18n.t("generateDraft")}
                </Link>
              </div>

              {loadingDocuments ? (
                <div className="py-8 text-center text-slate-500">
                  {i18n.t("loadingDocuments")}
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                  {i18n.t("noDocuments")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-slate-50">
                      <tr className="text-left">
                        <th className="px-3 py-3">{i18n.t("document")}</th>
                        <th className="px-3 py-3">{i18n.t("matter")}</th>
                        <th className="px-3 py-3">{i18n.t("type")}</th>
                        <th className="px-3 py-3">{i18n.t("version")}</th>
                        <th className="px-3 py-3">{i18n.t("updated")}</th>
                        <th className="px-3 py-3">{i18n.t("actions")}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-slate-50">
                          <td className="px-3 py-4 font-medium">{doc.title}</td>
                          <td className="px-3">{doc.matterTitle}</td>
                          <td className="px-3">{doc.documentType}</td>
                          <td className="px-3">v{doc.version}</td>
                          <td className="px-3">
                            {new Date(doc.updatedAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-3">
                            <Link
                              to={`/documents/${doc.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {i18n.t("open")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold">
                {i18n.t("activityTimeline")}
              </h2>

              {loadingTimeline ? (
                <div className="py-8 text-center text-slate-500">
                  {i18n.t("loadingTimeline")}
                </div>
              ) : timeline.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                  {i18n.t("noActivityFound")}
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item, index) => {
                    const translatedTitle =
                      item.title === "Hearing Scheduled"
                        ? i18n.t("hearingScheduled")
                        : item.title === "Document Generated"
                          ? i18n.t("documentGenerated")
                          : item.title;

                    const translatedDescription = item.description
                      .replace("First Hearing", i18n.t("firstHearing"))
                      .replace("Evidence", i18n.t("evidence"))
                      .replace("Arguments", i18n.t("arguments"))
                      .replace("Cross Examination", i18n.t("crossExamination"))
                      .replace("Final Order", i18n.t("finalOrder"));

                    const translatedType =
                      item.type === "Hearing"
                        ? i18n.t("hearing")
                        : item.type === "Document"
                          ? i18n.t("document")
                          : item.type;

                    return (
                      <div
                        key={index}
                        className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div className="mt-1 h-3 w-3 rounded-full bg-blue-600"></div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{translatedTitle}</h3>

                            <span className="text-sm text-slate-500">
                              {new Date(item.date).toLocaleDateString(
                                i18n.language === "hi" ? "hi-IN" : "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-slate-600">
                            {translatedDescription}
                          </p>

                          <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {translatedType}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
