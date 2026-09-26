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
  ShieldAlert,
  RefreshCw,
  Circle,
} from "lucide-react";

import { getMatter } from "../api/matters";
import { getHearingsByMatter } from "../api/hearings";
import { getDocumentsByMatter } from "../api/documents";
import CopilotPanel from "../components/CopilotPanel";
import { legalText } from "../utils/legalTranslations";
import i18n from "../i18n";
import api from "../api/client";


function formatTimelineDate(date: string) {
  const d = new Date(date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const compare = new Date(d);
  compare.setHours(0, 0, 0, 0);

  const diff = Math.round(
    (today.getTime() - compare.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) return i18n.language.startsWith("hi") ? "आज" : "Today";

  if (diff === 1) return i18n.language.startsWith("hi") ? "कल" : "Yesterday";

  return d.toLocaleDateString(
    i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

export default function MatterWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [matter, setMatter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hearings, setHearings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [, setLang] = useState(i18n.language);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editCourt, setEditCourt] = useState("");
  const [editMatterType, setEditMatterType] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [caseSummary, setCaseSummary] = useState<{
    summary: string;
    keyFacts: string[];
    riskLevel: string;
    nextAction: string;
    nextHearing?: string;
  } | null>(null);

  function aiText(text?: string) {
    if (!text) return "";
    if (!i18n.language.startsWith("hi")) return text;

    return text
      .replace(
        /^This is a Consumer matter involving (.+) before (.+)\.$/i,
        "यह $2 में $1 से संबंधित उपभोक्ता मामला है।",
      )
      .replace(/^Consumer matter\.$/i, "उपभोक्ता मामला।")
      .replace(/^Court:\s*(.+)\.$/i, "न्यायालय: $1।")
      .replace(/^Client:\s*(.+)\.$/i, "मुवक्किल: $1।")
      .replace(/^Next hearing:\s*(.+)\.$/i, "अगली सुनवाई: $1।")
      .replace(/^Prepare for First Hearing\.$/i, "प्रथम सुनवाई की तैयारी करें।")
      .replace(
        /^(\d+)\s*document\(s\)\s*available\.$/i,
        "$1 दस्तावेज उपलब्ध हैं।",
      )
      .replace(/^Medium$/i, "मध्यम")
      .replace(/^High$/i, "उच्च")
      .replace(/^Low$/i, "कम");
  }

  const loadCaseSummary = async () => {
    if (!id) return;

    try {
      setSummaryLoading(true);

      const { data } = await api.get(`/AI/case-summary/${id}`);

      setCaseSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const saveMatter = async () => {
    if (!id) return;

    try {
      await api.put(`/Matters/${id}`, {
        title: editTitle,
        court: editCourt,
        matterType: editMatterType,
        status: editStatus,
      });

      // Update UI immediately
      setMatter((prev: any) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              court: editCourt,
              matterType: editMatterType,
              status: editStatus,
            }
          : prev,
      );

      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      alert(
        i18n.language.startsWith("hi")
          ? "मामला अपडेट नहीं हो सका।"
          : "Failed to update matter.",
      );
    }
  };

  const uploadEvidence = async () => {
    if (!id || !selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("matterId", id);
      formData.append("file", selectedFile);

      await api.post("/Documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          setUploadProgress(
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          );
        },
      });

      // Refresh evidence list
      const docs = await getDocumentsByMatter(id);
      setDocuments(docs);

      setSelectedFile(null);
      setUploadProgress(0);
      setShowUploadModal(false);
    } catch (err) {
      console.error(err);
      alert(
        i18n.language.startsWith("hi") ? "अपलोड विफल हुआ।" : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;

        const [matterResult, hearingResult, documentResult, timelineResult] =
          await Promise.allSettled([
            getMatter(id),
            getHearingsByMatter(id),
            getDocumentsByMatter(id),
            api.get(`/Matters/${id}/timeline`),
          ]);

        if (matterResult.status === "fulfilled") {
          setMatter(matterResult.value);
          setEditTitle(matterResult.value.title);
          setEditCourt(matterResult.value.court);
          setEditMatterType(matterResult.value.matterType);
          setEditStatus(matterResult.value.status);
        }

        if (hearingResult.status === "fulfilled")
          setHearings(hearingResult.value);

        if (documentResult.status === "fulfilled")
          setDocuments(documentResult.value);

        if (timelineResult.status === "fulfilled")
          setTimeline(timelineResult.value.data);

        await loadCaseSummary();

        if (matterResult.status === "rejected")
          console.error(matterResult.reason);

        if (hearingResult.status === "rejected")
          console.error(hearingResult.reason);

        if (documentResult.status === "rejected")
          console.error(documentResult.reason);

        if (timelineResult.status === "rejected")
          console.error(timelineResult.reason);
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
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-8 text-white">
              <div className="border-b border-white/15 pb-5 text-center">
                <p className="text-xs font-semibold tracking-[0.35em] text-blue-200 uppercase">
                  {i18n.t("inTheCourtOf")}
                </p>

                <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                  {matter.court}
                </h1>

                <p className="mt-2 text-blue-200">{matter.title}</p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                    {i18n.t("matterNumber")}: {matter.matterNumber}
                  </span>

                  <span className="rounded-full bg-blue-500/25 px-3 py-1 text-sm">
                    {legalText(matter.matterType)}
                  </span>

                  <span className="rounded-full bg-green-500/25 px-3 py-1 text-sm">
                    {legalText(matter.status)}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/ai-drafts?matterId=${matter.id}`)}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-slate-100"
                >
                  {i18n.t("generateDraft")}
                </button>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-200">
                    {i18n.t("client")}
                  </p>

                  <p className="mt-1 font-semibold">
                    {matter.client?.fullName || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-200">
                    {i18n.t("judge")}
                  </p>

                  <p className="mt-1 font-semibold">
                    {matter.judgeName || i18n.t("notAssigned")}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-200">
                    {i18n.t("status")}
                  </p>

                  <p className="mt-1 font-semibold">
                    {legalText(matter.status)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {caseSummary && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-600 p-3 text-white">
                    <Sparkles size={22} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      {i18n.language.startsWith("hi")
                        ? "एआई मामले का सारांश"
                        : "AI Case Summary"}
                    </h2>

                    <p className="text-sm text-slate-500">
                      {i18n.language.startsWith("hi")
                        ? "मामले का स्वतः तैयार किया गया सारांश"
                        : "Automatically generated case insights"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadCaseSummary}
                  disabled={summaryLoading}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={summaryLoading ? "animate-spin" : ""}
                  />

                  {i18n.language.startsWith("hi")
                    ? "पुनः तैयार करें"
                    : "Regenerate"}
                </button>
              </div>

              <p className="mb-6 leading-7 text-slate-700">
                {aiText(caseSummary.summary)}
              </p>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Key Facts */}

                <div>
                  <h3 className="mb-3 font-semibold">
                    {i18n.language.startsWith("hi")
                      ? "मुख्य तथ्य"
                      : "Key Facts"}
                  </h3>

                  <ul className="space-y-2">
                    {caseSummary.keyFacts.map((fact, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                        {aiText(fact)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk */}

                <div>
                  <h3 className="mb-3 font-semibold">
                    {i18n.language.startsWith("hi")
                      ? "जोखिम स्तर"
                      : "Risk Level"}
                  </h3>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                      caseSummary.riskLevel === "High"
                        ? "bg-red-100 text-red-700"
                        : caseSummary.riskLevel === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    <ShieldAlert size={16} />
                    {legalText(caseSummary.riskLevel)}
                  </span>
                </div>

                {/* Next Action */}

                <div>
                  <h3 className="mb-3 font-semibold">
                    {i18n.language.startsWith("hi")
                      ? "अगला कदम"
                      : "Next Recommended Action"}
                  </h3>

                  <p className="text-sm text-slate-700">
                    {aiText(caseSummary.nextAction)}
                  </p>

                  {caseSummary.nextHearing && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        {i18n.language.startsWith("hi")
                          ? "अगली सुनवाई"
                          : "Next Hearing"}
                      </div>

                      <div className="font-semibold text-blue-700">
                        {new Date(caseSummary.nextHearing).toLocaleDateString(
                          i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                  hearings.map((h) => {
                    const hearingDate = new Date(h.hearingDate);
                    const today = new Date();

                    today.setHours(0, 0, 0, 0);

                    const compareDate = new Date(h.hearingDate);
                    compareDate.setHours(0, 0, 0, 0);

                    const diff = Math.round(
                      (compareDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );

                    const badge =
                      diff === 0
                        ? {
                            text: i18n.t("today"),
                            cls: "bg-red-100 text-red-700",
                          }
                        : diff === 1
                          ? {
                              text: i18n.t("tomorrow"),
                              cls: "bg-orange-100 text-orange-700",
                            }
                          : {
                              text: i18n.t("upcoming"),
                              cls: "bg-blue-100 text-blue-700",
                            };

                    return (
                      <div
                        key={h.id}
                        className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {legalText(h.stage)}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {hearingDate.toLocaleDateString(
                                i18n.language.startsWith("hi")
                                  ? "hi-IN"
                                  : "en-IN",
                                {
                                  weekday: "long",
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${badge.cls}`}
                          >
                            {badge.text}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs uppercase tracking-wide text-slate-500">
                              {i18n.t("judge")}
                            </div>

                            <div className="mt-1 font-medium">
                              {h.judgeName || i18n.t("judgeTBD")}
                            </div>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs uppercase tracking-wide text-slate-500">
                              {i18n.t("courtRoom")}
                            </div>

                            <div className="mt-1 font-medium">
                              {h.courtRoom || i18n.t("courtTBD")}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
          {/* CASE TIMELINE */}

          <Section
            title={i18n.t("caseTimeline")}
            icon={<CalendarDays size={20} />}
          >
            <div className="relative ml-3 border-l-2 border-slate-200 pl-6">
              {timeline.length === 0 ? (
                <EmptyCard text={i18n.t("noTimeline")} />
              ) : (
                timeline.map((event: any) => {
                  const type = event.eventType || event.type || "";

                  const Icon = type.startsWith("Matter")
                    ? Scale
                    : type === "Hearing"
                      ? CalendarDays
                      : type === "Document"
                        ? FileText
                        : type === "AI"
                          ? Sparkles
                          : Circle;

                  const iconColor = type.startsWith("Matter")
                    ? "text-blue-600"
                    : type === "Hearing"
                      ? "text-orange-600"
                      : type === "Document"
                        ? "text-indigo-600"
                        : type === "AI"
                          ? "text-purple-600"
                          : "text-slate-500";

                  return (
                    <div key={event.id} className="relative mb-6">
                      <div
                        className={`absolute -left-[40px] rounded-full border-4 border-white p-2 shadow-lg ${
                          type.startsWith("Matter")
                            ? "bg-blue-50"
                            : type === "Hearing"
                              ? "bg-orange-50"
                              : type === "Document"
                                ? "bg-indigo-50"
                                : type === "AI"
                                  ? "bg-purple-50"
                                  : "bg-slate-50"
                        }`}
                      >
                        <Icon size={18} className={iconColor} />
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">
                            {type.startsWith("Matter")
                              ? i18n.t("matterRegistered")
                              : legalText(event.title)}
                          </h3>

                          <span className="text-xs text-slate-500">
                            {formatTimelineDate(
                              event.eventDate || event.date || event.createdAt,
                            )}
                          </span>
                        </div>

                        {type.startsWith("Matter") ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {i18n.t("matterCreated", {
                              number: matter.matterNumber,
                            })}
                          </p>
                        ) : event.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {legalText(event.description)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>
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

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
            >
              <Upload size={18} />
              {i18n.language.startsWith("hi")
                ? "साक्ष्य अपलोड करें"
                : "Upload Evidence"}
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
            >
              <Pencil size={18} />
              {i18n.language.startsWith("hi")
                ? "मामला संपादित करें"
                : "Edit Matter"}
            </button>
          </Section>

          <CopilotPanel matterId={matter.id} />
        </div>
      </div>
      {/* Upload Evidence Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {i18n.language.startsWith("hi")
                  ? "साक्ष्य अपलोड करें"
                  : "Upload Evidence"}
              </h2>

              <button onClick={() => setShowUploadModal(false)}>✕</button>
            </div>

            <div className="space-y-5">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center transition hover:border-blue-500 hover:bg-blue-100">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />

                <Upload className="mx-auto mb-3 text-blue-600" size={36} />

                <p className="font-medium text-slate-800">
                  {selectedFile
                    ? selectedFile.name
                    : i18n.language.startsWith("hi")
                      ? "फ़ाइल चुनें"
                      : "Choose a file"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  PDF • JPG • PNG • DOCX (20 MB)
                </p>
              </label>

              {uploading && (
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>
                      {i18n.language.startsWith("hi")
                        ? "अपलोड हो रहा है..."
                        : "Uploading..."}
                    </span>

                    <span>{uploadProgress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setShowUploadModal(false);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  {i18n.t("cancel")}
                </button>

                <button
                  onClick={uploadEvidence}
                  disabled={!selectedFile || uploading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {uploading ? `${uploadProgress}%` : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Matter Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {i18n.language.startsWith("hi")
                  ? "मामला संपादित करें"
                  : "Edit Matter"}
              </h2>

              <button onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  {i18n.t("matterTitle")}
                </label>

                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {i18n.t("court")}
                </label>

                <input
                  value={editCourt}
                  onChange={(e) => setEditCourt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {i18n.t("matterType")}
                </label>

                <input
                  value={editMatterType}
                  onChange={(e) => setEditMatterType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  {i18n.t("status")}
                </label>

                <input
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                {i18n.t("cancel")}
              </button>

              <button
                onClick={() => {
                  // Wire to Update Matter API next.
                  saveMatter();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {i18n.t("saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
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
