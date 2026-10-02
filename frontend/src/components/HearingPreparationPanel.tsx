import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gavel,
  Loader2,
  MessageSquareText,
  Scale,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import i18n from "../i18n";

interface HearingPreparationHearing {
  id: string;
  hearingDate: string;
  stage: string;
  judgeName?: string;
  courtRoom?: string;
  isCompleted?: boolean;

  // Support both shapes returned by the hearings API:
  // 1. matterId + optional flattened matter fields
  // 2. nested matter object
  matterId?: string;

  matter?: {
    id?: string;
    title?: string;
    matterNumber?: string;
    court?: string;
    client?: {
      fullName?: string;
    };
  };

  matterNumber?: string;
  matterTitle?: string;
  court?: string;
  clientName?: string;
}

interface Matter {
  id: string;
  matterNumber?: string;
  caseNumber?: string;
  title?: string;
  court?: string;
  status?: string;
  matterType?: string;
  client?: {
    fullName?: string;
    name?: string;
  };
  clientName?: string;
}

interface CopilotDocument {
  id: string;
  title: string;
  documentType?: string;
  version?: number;
  status?: string;
}

interface Props {
  open: boolean;
  hearing: HearingPreparationHearing;
  onClose: () => void;
}

type ActionKey = "brief" | "cross" | "arguments" | "issues";

const ACTIONS: Array<{
  key: ActionKey;
  title: string;
  description: string;
  prompt: (witness: string) => string;
  icon: typeof Sparkles;
}> = [
  {
    key: "brief",
    title: "AI Hearing Brief",
    description:
      "Summarize the matter, relevant documents, prior hearings and preparation points.",
    prompt: () =>
      "Prepare a concise hearing brief for the upcoming hearing. Use the matter information, hearing history, timeline and selected legal documents. Structure it as: 1. Matter Overview, 2. Hearing Details, 3. Key Facts, 4. Relevant Documents, 5. Previous Hearing Context, 6. Issues to Address, 7. Recommended Preparation Points. Do not invent facts.",
    icon: Sparkles,
  },
  {
    key: "cross",
    title: "Cross-Examination",
    description:
      "Generate grounded questions from the selected witness testimony or evidence.",
    prompt: (witness) =>
      `Prepare cross-examination questions for ${witness || "the relevant witness"} for the upcoming hearing. Use only facts supported by the selected documents and matter context. Do not invent facts. Produce numbered, courtroom-ready questions and identify the source document or testimony basis where possible.`,
    icon: MessageSquareText,
  },
  {
    key: "arguments",
    title: "Prepare Arguments",
    description:
      "Create a hearing-focused argument outline grounded in the matter record.",
    prompt: () =>
      "Prepare arguments for the upcoming hearing. Use only the matter information and selected documents. Structure the response as: 1. Issues, 2. Relevant Facts, 3. Documents/Evidence Relied Upon, 4. Submissions, 5. Anticipated Counterpoints, 6. Closing/Relief Sought. Clearly distinguish facts from legal submissions and do not invent authorities or facts.",
    icon: Scale,
  },
  {
    key: "issues",
    title: "Issues for Hearing",
    description:
      "Identify factual and procedural issues that should be addressed.",
    prompt: () =>
      "Identify the issues that should be addressed at the upcoming hearing using only the matter context, hearing history and selected documents. Group them into: factual issues, evidentiary issues, procedural issues, and questions requiring clarification. Do not invent facts.",
    icon: Gavel,
  },
];

export default function HearingPreparationPanel({
  open,
  hearing,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const hindi = i18n.language.startsWith("hi");

  const [matter, setMatter] = useState<Matter | null>(null);
  const [documents, setDocuments] = useState<CopilotDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [runningAction, setRunningAction] = useState<ActionKey | null>(null);
  const [result, setResult] = useState("");
  const [witness, setWitness] = useState("PW1");
  const [error, setError] = useState("");

  const matterId =
    hearing.matterId ||
    hearing.matter?.id ||
    "";

  useEffect(() => {
    if (!open || !matterId) return;

    let cancelled = false;

    const loadContext = async () => {
      setLoadingContext(true);
      setError("");
      setResult("");

      try {
        const [matterResult, documentsResult] = await Promise.allSettled([
          api.get<Matter>(`/Matters/${matterId}`),
          api.get<CopilotDocument[]>(`/Documents/matter/${matterId}`),
        ]);

        if (cancelled) return;

        if (matterResult.status === "fulfilled") {
          setMatter(matterResult.value.data);
        } else {
          setMatter(null);
        }

        if (documentsResult.status === "fulfilled") {
          const loaded = Array.isArray(documentsResult.value.data)
            ? documentsResult.value.data
            : [];

          setDocuments(loaded);
          setSelectedDocumentIds(loaded.map((document) => document.id));
        } else {
          setDocuments([]);
          setSelectedDocumentIds([]);
        }
      } catch (err) {
        console.error("Failed to load hearing preparation context", err);

        if (!cancelled) {
          setError(
            hindi
              ? "सुनवाई की तैयारी का संदर्भ लोड नहीं किया जा सका।"
              : "Unable to load the hearing preparation context.",
          );
        }
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    };

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [open, matterId, hindi]);

  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocumentIds(documents.map((document) => document.id));
  };

  const clearDocuments = () => {
    setSelectedDocumentIds([]);
  };

  const runAction = async (action: (typeof ACTIONS)[number]) => {
    if (!matterId || runningAction) return;

    setRunningAction(action.key);
    setError("");
    setResult("");

    try {
      const { data } = await api.post("/copilot/chat", {
        matterId,
        message: action.prompt(witness.trim()),
        documentIds: selectedDocumentIds,
      });

      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : "";

      if (!reply) {
        throw new Error("No Copilot response was returned.");
      }

      setResult(reply);
    } catch (err) {
      console.error("Hearing preparation Copilot request failed", err);

      setError(
        hindi
          ? "Copilot सुनवाई की तैयारी तैयार नहीं कर सका।"
          : "Copilot could not prepare this hearing item.",
      );
    } finally {
      setRunningAction(null);
    }
  };

  const openResultInEditor = () => {
    if (!result || !matterId) return;

    navigate(`/ai-drafts?matterId=${matterId}`, {
      state: {
        aiContent: result,
        source: "hearing-preparation",
      },
    });

    onClose();
  };

  if (!open) return null;

  const hearingDate = new Date(hearing.hearingDate);
  const selectedCount = selectedDocumentIds.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
              aria-label={hindi ? "बंद करें" : "Close"}
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="shrink-0 text-indigo-600" size={20} />
                <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {hindi ? "सुनवाई की तैयारी" : "Hearing Preparation"}
                </h2>
              </div>

              <p className="mt-0.5 truncate text-sm text-slate-500">
                {matter?.title ||
                  hearing.matter?.title ||
                  hearing.matterTitle ||
                  (hindi ? "मामला" : "Matter")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label={hindi ? "बंद करें" : "Close"}
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="text-blue-600" size={20} />
                  <h3 className="font-bold text-slate-900">
                    {hindi ? "सुनवाई विवरण" : "Hearing Details"}
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    label={hindi ? "तारीख" : "Date"}
                    value={hearingDate.toLocaleDateString(
                      hindi ? "hi-IN" : "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  />
                  <InfoItem
                    label={hindi ? "समय" : "Time"}
                    value={hearingDate.toLocaleTimeString(
                      hindi ? "hi-IN" : "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  />
                  <InfoItem
                    label={hindi ? "चरण" : "Stage"}
                    value={hearing.stage || "—"}
                  />
                  <InfoItem
                    label={hindi ? "न्यायाधीश" : "Judge"}
                    value={hearing.judgeName || "—"}
                  />
                  <InfoItem
                    label={hindi ? "कोर्ट" : "Court"}
                    value={
                      hearing.courtRoom ||
                      matter?.court ||
                      hearing.matter?.court ||
                      hearing.court ||
                      "—"
                    }
                  />
                  <InfoItem
                    label={hindi ? "मामला संख्या" : "Matter Number"}
                    value={
                      matter?.matterNumber ||
                      matter?.caseNumber ||
                      hearing.matter?.matterNumber ||
                      hearing.matterNumber ||
                      "—"
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Scale className="text-indigo-600" size={20} />
                  <h3 className="font-bold text-slate-900">
                    {hindi ? "मामला संदर्भ" : "Matter Context"}
                  </h3>
                </div>

                {loadingContext ? (
                  <div className="flex items-center gap-2 py-5 text-sm text-slate-500">
                    <Loader2 className="animate-spin" size={17} />
                    {hindi ? "संदर्भ लोड हो रहा है..." : "Loading context..."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <InfoItem
                      label={hindi ? "मामला" : "Matter"}
                      value={
                        matter?.title ||
                        hearing.matter?.title ||
                        hearing.matterTitle ||
                        (hindi ? "उपलब्ध नहीं" : "Not available")
                      }
                    />
                    <InfoItem
                      label={hindi ? "क्लाइंट" : "Client"}
                      value={
                        matter?.client?.fullName ||
                        matter?.client?.name ||
                        matter?.clientName ||
                        hearing.matter?.client?.fullName ||
                        hearing.clientName ||
                        "—"
                      }
                    />
                    <InfoItem
                      label={hindi ? "स्थिति" : "Status"}
                      value={matter?.status || "—"}
                    />

                    <InfoItem
                      label="Matter ID"
                      value={matterId || "Not returned by Hearings API"}
                    />
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="text-blue-600" size={20} />
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {hindi ? "स्रोत दस्तावेज़" : "Source Documents"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedCount} / {documents.length}{" "}
                        {hindi ? "चयनित" : "selected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllDocuments}
                      disabled={documents.length === 0}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                    >
                      {hindi ? "सभी चुनें" : "Select all"}
                    </button>
                    <button
                      type="button"
                      onClick={clearDocuments}
                      disabled={selectedCount === 0}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                    >
                      {hindi ? "साफ करें" : "Clear"}
                    </button>
                  </div>
                </div>

                {loadingContext ? (
                  <div className="py-5 text-sm text-slate-500">
                    {hindi
                      ? "दस्तावेज़ लोड हो रहे हैं..."
                      : "Loading documents..."}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                    {hindi
                      ? "इस मामले में कोई दस्तावेज़ उपलब्ध नहीं है।"
                      : "No documents are available for this matter."}
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {documents.map((document) => {
                      const selected = selectedDocumentIds.includes(
                        document.id,
                      );

                      return (
                        <label
                          key={document.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                            selected
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleDocument(document.id)}
                            className="mt-1 h-4 w-4 accent-blue-600"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {document.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {document.documentType || "Document"}
                              {document.version
                                ? ` • v${document.version}`
                                : ""}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  {hindi
                    ? "गवाह (Cross-Examination के लिए)"
                    : "Witness (for Cross-Examination)"}
                </label>

                <input
                  value={witness}
                  onChange={(event) => setWitness(event.target.value)}
                  placeholder="PW1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  {hindi
                    ? "उदाहरण: PW1, PW2, Complainant."
                    : "Example: PW1, PW2, Complainant."}
                </p>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                <div className="mb-5 flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
                    <Bot size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      DraftLex Hearing Intelligence
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {hindi
                        ? "मामले के रिकॉर्ड से grounded तैयारी तैयार करें।"
                        : "Generate grounded preparation from the matter record."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const running = runningAction === action.key;

                    return (
                      <button
                        type="button"
                        key={action.key}
                        disabled={Boolean(runningAction)}
                        onClick={() => runAction(action)}
                        className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                            {running ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Icon size={18} />
                            )}
                          </span>
                          <span className="text-xs font-medium text-indigo-600">
                            {running
                              ? hindi
                                ? "तैयार हो रहा है..."
                                : "Preparing..."
                              : "AI"}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900">
                          {action.title}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {action.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2 text-xs text-slate-500">
                  <CheckCircle2 className="shrink-0 text-green-600" size={15} />
                  {hindi
                    ? "AI उत्तर चुने गए दस्तावेज़ों और मामले के संदर्भ पर आधारित है।"
                    : "AI output is grounded in the selected documents and matter context."}
                </div>
              </section>

              <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-slate-600" size={19} />
                    <h3 className="font-bold text-slate-900">
                      {hindi ? "तैयारी परिणाम" : "Preparation Result"}
                    </h3>
                  </div>

                  {result && (
                    <button
                      type="button"
                      onClick={openResultInEditor}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {hindi ? "Editor में खोलें" : "Open in Editor"}
                    </button>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {runningAction ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                      <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                        <Loader2 className="animate-spin" size={28} />
                      </div>
                      <h4 className="mt-4 font-semibold text-slate-900">
                        {hindi
                          ? "Hearing preparation तैयार हो रही है..."
                          : "Preparing your hearing materials..."}
                      </h4>
                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {hindi
                          ? "चयनित matter documents को संदर्भ के रूप में उपयोग किया जा रहा है।"
                          : "The selected matter documents are being used as context."}
                      </p>
                    </div>
                  ) : result ? (
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
                      {result}
                    </pre>
                  ) : (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                      <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                        <MessageSquareText size={28} />
                      </div>
                      <h4 className="mt-4 font-semibold text-slate-800">
                        {hindi
                          ? "एक तैयारी विकल्प चुनें"
                          : "Choose a preparation option"}
                      </h4>
                      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                        {hindi
                          ? "Hearing Brief, Cross-Examination, Arguments या Issues चुनकर matter-grounded तैयारी तैयार करें।"
                          : "Choose Hearing Brief, Cross-Examination, Arguments or Issues to generate matter-grounded preparation."}
                      </p>
                    </div>
                  )}
                </div>

                {result && (
                  <div className="shrink-0 border-t bg-slate-50 px-5 py-3 text-xs text-slate-500">
                    {hindi
                      ? "AI आउटपुट को अदालत में उपयोग करने से पहले रिकॉर्ड के विरुद्ध सत्यापित करें।"
                      : "Verify AI-generated material against the case record before using it in court."}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-white px-5 py-3">
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Clock3 size={14} />
            {hearingDate.toLocaleDateString(hindi ? "hi-IN" : "en-IN")}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {hindi ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}
