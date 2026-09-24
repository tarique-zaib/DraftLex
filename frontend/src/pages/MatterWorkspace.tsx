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
  Upload,
  Pencil,
  Sparkles,
} from "lucide-react";

import { getMatter } from "../api/matters";
import { getHearingsByMatter } from "../api/hearings";
import { getDocumentsByMatter } from "../api/documents";
import CopilotPanel from "../components/CopilotPanel";
import { legalText } from "../utils/legalTranslations";
import i18n from "../i18n";

export default function MatterWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [matter, setMatter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hearings, setHearings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [, setLang] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

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

        if (matterResult.status === "fulfilled") setMatter(matterResult.value);

        if (hearingResult.status === "fulfilled")
          setHearings(hearingResult.value);

        if (documentResult.status === "fulfilled")
          setDocuments(documentResult.value);

        if (matterResult.status === "rejected")
          console.error(matterResult.reason);

        if (hearingResult.status === "rejected")
          console.error(hearingResult.reason);

        if (documentResult.status === "rejected")
          console.error(documentResult.reason);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">{i18n.t("loadingMatter")}</p>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-red-600">{i18n.t("matterNotFound")}</p>
      </div>
    );
  }

  const progress =
    matter.status === "Closed" ? 100 : matter.status === "Active" ? 65 : 35;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft size={20} />
        {i18n.t("back")}
      </button>

      {/* MAIN LAYOUT */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* HERO */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-800 p-8 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold">{matter.title}</h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/30 px-3 py-1 text-sm">
                      {legalText(matter.matterType)}
                    </span>

                    <span className="rounded-full bg-green-500/30 px-3 py-1 text-sm">
                      {legalText(matter.status)}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                      {matter.matterNumber}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/ai-drafts?matterId=${matter.id}`)}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-slate-100"
                >
                  {i18n.t("generateDraft")}
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-blue-200">{i18n.t("court")}</p>
                  <p className="font-semibold">{matter.court}</p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">{i18n.t("judge")}</p>
                  <p className="font-semibold">
                    {matter.judgeName || i18n.t("notAssigned")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">{i18n.t("client")}</p>
                  <p className="font-semibold">
                    {matter.client?.fullName || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK INFO */}
          {/* DASHBOARD CARDS */}

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <InfoCard
              icon={<Scale className="text-blue-600" />}
              label={i18n.t("matterType")}
              value={legalText(matter.matterType)}
            />

            <InfoCard
              icon={<User className="text-blue-600" />}
              label={i18n.t("client")}
              value={matter.client?.fullName || "—"}
            />

            <InfoCard
              icon={<Building2 className="text-blue-600" />}
              label={i18n.t("court")}
              value={matter.court}
            />

            <InfoCard
              icon={<Gavel className="text-blue-600" />}
              label={i18n.t("judge")}
              value={matter.judgeName || i18n.t("notAssigned")}
            />

            <InfoCard
              icon={<CalendarDays className="text-blue-600" />}
              label={i18n.t("hearings")}
              value={hearings.length.toString()}
            />

            <InfoCard
              icon={<FileText className="text-blue-600" />}
              label={i18n.t("documents")}
              value={documents.length.toString()}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {i18n.language.startsWith("hi")
                  ? "मामले की प्रगति"
                  : "Case Progress"}
              </h2>

              <span className="font-semibold text-blue-700">{progress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {i18n.language.startsWith("hi")
                ? "मामले की वर्तमान स्थिति के आधार पर अनुमानित प्रगति।"
                : "Estimated progress based on the current case status."}
            </p>
          </div>

          {/* DETAILS */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title={i18n.t("caseInformation")}>
              <InfoRow
                label={i18n.t("matterNumber")}
                value={matter.matterNumber}
              />

              <InfoRow
                label={i18n.t("caseNumber")}
                value={matter.caseNumber || "N/A"}
              />

              <InfoRow
                label={i18n.t("matterType")}
                value={legalText(matter.matterType)}
              />

              <InfoRow
                label={i18n.t("status")}
                value={legalText(matter.status)}
              />
            </Section>

            <Section title={i18n.t("clientInformation")}>
              <InfoRow
                label={i18n.t("client")}
                value={matter.client?.fullName || "—"}
              />

              <InfoRow
                label={i18n.t("clientCode")}
                value={matter.client?.clientCode || "—"}
              />

              <InfoRow
                label={i18n.t("mobile")}
                value={matter.client?.mobile || "—"}
              />
            </Section>
          </div>

          {/* OPPOSITE PARTY */}
          <Section title={i18n.t("oppositeParty")}>
            <InfoRow
              label={i18n.t("name")}
              value={matter.oppositePartyName || i18n.t("notAvailable")}
            />

            <InfoRow
              label={i18n.t("address")}
              value={matter.oppositePartyAddress || i18n.t("notAvailable")}
            />
          </Section>

          {/* HEARINGS + DOCUMENTS */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title={i18n.t("upcomingHearings")}
              icon={<CalendarDays size={20} />}
            >
              <div className="space-y-3">
                {hearings.length === 0 ? (
                  <EmptyCard text={i18n.t("noHearingsScheduled")} />
                ) : (
                  hearings.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{legalText(h.stage)}</p>

                          <p className="text-sm text-slate-500">
                            {new Date(h.hearingDate).toLocaleDateString(
                              i18n.language.startsWith("hi")
                                ? "hi-IN"
                                : "en-IN",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>

                          <p className="text-xs text-slate-400">
                            {h.judgeName || i18n.t("judgeTBD")} •{" "}
                            {h.courtRoom || i18n.t("courtTBD")}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                          {i18n.t("upcoming")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>

            <Section
              title={i18n.t("aiDocuments")}
              icon={<FileText size={20} />}
            >
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <EmptyCard text={i18n.t("noAiDocuments")} />
                ) : (
                  documents.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{d.title}</p>

                          <p className="text-sm text-slate-500">
                            {i18n.t("version")} {d.version} • {d.documentType}
                          </p>

                          <p className="text-xs text-slate-400">
                            {new Date(d.updatedAt).toLocaleDateString(
                              i18n.language.startsWith("hi")
                                ? "hi-IN"
                                : "en-IN",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => navigate(`/documents/${d.id}`)}
                          className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100"
                        >
                          {i18n.t("open")}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>
          </div>
        </div>

        {/* RIGHT - AI COPILOT */}
        {/* RIGHT PANEL */}

        <div className="space-y-6 xl:sticky xl:top-8">
          <Section
            title={
              i18n.language.startsWith("hi") ? "त्वरित कार्य" : "Quick Actions"
            }
          >
            <button
              onClick={() => navigate(`/hearings?matterId=${matter.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
            >
              <CalendarDays size={18} />
              {i18n.language.startsWith("hi")
                ? "सुनवाई निर्धारित करें"
                : "Schedule Hearing"}
            </button>

            <button
              onClick={() => navigate(`/ai-drafts?matterId=${matter.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
            >
              <Sparkles size={18} />
              {i18n.t("generateDraft")}
            </button>

            <button className="flex w-full items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50">
              <Upload size={18} />
              {i18n.language.startsWith("hi")
                ? "साक्ष्य अपलोड करें"
                : "Upload Evidence"}
            </button>

            <button className="flex w-full items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50">
              <Pencil size={18} />
              {i18n.language.startsWith("hi")
                ? "मामला संपादित करें"
                : "Edit Matter"}
            </button>
          </Section>

          <CopilotPanel matterId={matter.id} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
      {text}
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
