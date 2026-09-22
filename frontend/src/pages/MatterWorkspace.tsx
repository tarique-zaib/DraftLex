import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Scale,
  CalendarDays,
  FileText,
  User,
  Building2,
  Gavel,
} from "lucide-react";
import { getMatter } from "../api/matters";
import { getHearingsByMatter } from "../api/hearings";
import { getDocumentsByMatter } from "../api/documents";

export default function MatterWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [matter, setMatter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hearings, setHearings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;

        const [matterResult, hearingResult, documentResult] =
          await Promise.allSettled([
            getMatter(id),
            getHearingsByMatter(id),
            getDocumentsByMatter(id),
          ]);

        if (matterResult.status === "fulfilled" && matterResult.value) {
          setMatter(matterResult.value);
        }

        if (hearingResult.status === "fulfilled") {
          setHearings(hearingResult.value);
        }

        if (documentResult.status === "fulfilled") {
          setDocuments(documentResult.value);
        }

        if (matterResult.status === "rejected") {
          console.error("Matter API failed", matterResult.reason);
        }

        if (hearingResult.status === "rejected") {
          console.error("Hearings API failed", hearingResult.reason);
        }

        if (documentResult.status === "rejected") {
          console.error("Documents API failed", documentResult.reason);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Loading matter...</p>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-red-600">Matter not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-800 p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold">{matter.title}</h1>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500/30 px-3 py-1 text-sm">
                  {matter.matterType}
                </span>

                <span className="rounded-full bg-green-500/30 px-3 py-1 text-sm">
                  {matter.status}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                  {matter.matterNumber}
                </span>
              </div>
            </div>

            <button className="rounded-lg bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-slate-100">
              Generate AI Draft
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-blue-200 text-sm">Court</p>
              <p className="font-semibold">{matter.court}</p>
            </div>

            <div>
              <p className="text-blue-200 text-sm">Judge</p>
              <p className="font-semibold">{matter.judgeName}</p>
            </div>

            <div>
              <p className="text-blue-200 text-sm">Client</p>
              <p className="font-semibold">{matter.client.fullName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <InfoCard
          icon={<Scale className="text-blue-600" />}
          label="Matter Type"
          value={matter.matterType}
        />

        <InfoCard
          icon={<User className="text-blue-600" />}
          label="Client"
          value={matter.client.fullName}
        />

        <InfoCard
          icon={<Building2 className="text-blue-600" />}
          label="Court"
          value={matter.court}
        />

        <InfoCard
          icon={<Gavel className="text-blue-600" />}
          label="Judge"
          value={matter.judgeName}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Case Information">
          <InfoRow label="Matter Number" value={matter.matterNumber} />
          <InfoRow label="Case Number" value={matter.caseNumber} />
          <InfoRow label="Matter Type" value={matter.matterType} />
          <InfoRow label="Status" value={matter.status} />
        </Section>

        <Section title="Client Information">
          <InfoRow label="Client Name" value={matter.client.fullName} />
          <InfoRow label="Client Code" value={matter.client.clientCode} />
          <InfoRow label="Mobile" value={matter.client.mobile} />
        </Section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Upcoming Hearings" icon={<CalendarDays size={20} />}>
          <div className="space-y-3">
            {hearings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                No upcoming hearings.
              </div>
            ) : (
              hearings.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{h.stage}</p>

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
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="AI Documents" icon={<FileText size={20} />}>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                No AI documents yet.
              </div>
            ) : (
              documents.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{d.title}</p>

                      <p className="text-sm text-slate-500">
                        Version {d.version} • {d.documentType}
                      </p>

                      <p className="text-xs text-slate-400">
                        {new Date(d.updatedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <button className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100">
                      Open
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-3">{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
