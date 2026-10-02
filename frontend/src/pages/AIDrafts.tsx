import i18n from "../i18n";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Sparkles, Loader2, BookOpen } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import ClauseLibraryModal from "../components/ClauseLibraryModal";

const localizeMatterContext = (text: string, isHindi: boolean) => {
  if (!isHindi) return text;

  return text
    .replace(/^Matter Number:/gm, "मामला संख्या:")
    .replace(/^Case Title:/gm, "वाद शीर्षक:")
    .replace(/^Client:/gm, "मुवक्किल:")
    .replace(/^Court:/gm, "न्यायालय:")
    .replace(/^Case Number:/gm, "वाद संख्या:")
    .replace(/^Judge:/gm, "न्यायाधीश:")
    .replace(/^Opposite Party:/gm, "विपक्षी पक्ष:")
    .replace(/^Current Status:\s*Active$/gm, "वर्तमान स्थिति: सक्रिय")
    .replace(/^Current Status:\s*Closed$/gm, "वर्तमान स्थिति: बंद")
    .replace(/^Current Stage:\s*First Hearing$/gm, "वर्तमान चरण: प्रथम सुनवाई")
    .replace(/^Current Stage:/gm, "वर्तमान चरण:")
    .replace(/^Facts Summary:/gm, "तथ्यों का सार:")

    // Full English summary → Hindi
    .replace(
      /This matter pertains to (.+?) before the (.+?)\.\s*The client is represented by the advocate, and the matter is presently at the (.+?) stage\./gs,
      "यह मामला $1 से संबंधित है, जो $2 के समक्ष लंबित है। इस मामले में मुवक्किल की ओर से अधिवक्ता प्रतिनिधित्व कर रहे हैं तथा वाद वर्तमान में $3 चरण में है।"
    )

    // Fallback if only first sentence exists
    .replace(
      /This matter pertains to (.+?) before the (.+?)\./g,
      "यह मामला $1 से संबंधित है, जो $2 के समक्ष लंबित है।"
    )

    // Stage translations inside the sentence
    .replace(/First Hearing/g, "प्रथम सुनवाई")
    .replace(/Evidence/g, "साक्ष्य")
    .replace(/Arguments/g, "बहस")
    .replace(/Judgment/g, "निर्णय");
};

interface Matter {
  id: string;
  matterNumber: string;
  title: string;
  court: string;
  client?: {
    fullName: string;
  };
}

const templates = [
  { value: "Legal Notice", en: "Legal Notice", hi: "कानूनी नोटिस" },
  { value: "Reply Notice", en: "Reply Notice", hi: "उत्तर नोटिस" },
  { value: "Affidavit", en: "Affidavit", hi: "शपथ पत्र" },
  { value: "Plaint", en: "Plaint", hi: "वाद पत्र" },
  { value: "Written Statement", en: "Written Statement", hi: "लिखित बयान" },
];

export default function AIDrafts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isHindi = i18n.language.startsWith("hi");

  const [loading, setLoading] = useState(false);
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loadingFacts, setLoadingFacts] = useState(false);

  const location = useLocation();

  const navigationState = location.state as
    | { aiContent?: string; source?: string }
    | null;

  const aiContent = navigationState?.aiContent ?? "";

  const isCopilotDraft =
    searchParams.get("source") === "copilot" ||
    navigationState?.source === "copilot";

  const [form, setForm] = useState({
    matterId: "",
    documentType: "Legal Notice",
    clientName: "",
    matterTitle: "",
    court: "",
    facts: "",
  });

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setShowClauseLibrary(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    const initialize = async () => {
      try {
        const { data: mattersData } = await api.get<Matter[]>("/Matters");
        setMatters(mattersData);

        const matterId = searchParams.get("matterId");

        if (matterId) {
          const matter = mattersData.find((m) => m.id === matterId);

          if (matter) {
            setForm((prev) => ({
              ...prev,
              matterId: matter.id,
              clientName: matter.client?.fullName ?? "",
              matterTitle: matter.title,
              court: matter.court,
            }));

            // Copilot content is the source for this editor page.
            // Do not replace it with the generic matter context.
            if (!isCopilotDraft || !aiContent.trim()) {
              try {
                const { data } = await api.get(`/AI/matter-context/${matterId}`);

                setForm((prev) => ({
                  ...prev,
                  facts: localizeMatterContext(data.facts || "", isHindi),
                }));
              } catch (err) {
                console.error("Failed to load matter context", err);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    initialize();

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [searchParams, isCopilotDraft, aiContent, isHindi]);

  useEffect(() => {
    if (!aiContent) return;

    setForm((prev) => ({
      ...prev,
      facts: aiContent,
      documentType:
        aiContent.includes("AFFIDAVIT") || aiContent.includes("शपथ")
          ? "Affidavit"
          : prev.documentType,
    }));
  }, [aiContent]);

  useEffect(() => {
    // When opened from Copilot, the generated content must remain
    // in the editor. Do not replace it with generic matter context.
    if (isCopilotDraft) return;
    if (!form.matterId) return;

    const reloadFacts = async () => {
      try {
        const { data } = await api.get(`/AI/matter-context/${form.matterId}`);

        setForm((prev) => ({
          ...prev,
          facts: localizeMatterContext(data.facts || "", isHindi),
        }));
      } catch (err) {
        console.error(err);
      }
    };

    reloadFacts();
  }, [isHindi, isCopilotDraft]);

  const selectMatter = async (id: string) => {
    const matter = matters.find((m) => m.id === id);
    setLoadingFacts(true);

    try {
      setForm((prev) => ({
        ...prev,
        matterId: id,
        clientName: matter?.client?.fullName ?? "",
        matterTitle: matter?.title ?? "",
        court: matter?.court ?? "",
      }));

      const { data } = await api.get(`/AI/matter-context/${id}`);

      setForm((prev) => ({
        ...prev,
        facts: localizeMatterContext(data.facts || "", isHindi),
      }));
    } catch (err) {
      console.error("Failed to load matter context", err);

      setForm((prev) => ({
        ...prev,
        facts: "",
      }));
    } finally {
      setLoadingFacts(false);
    }
  };

  const generateDraft = async () => {
    if (!form.matterId) {
      alert(isHindi ? "कृपया मामला चुनें।" : "Please select a Matter.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        matterId: form.matterId,
        documentType: form.documentType,
        language: isHindi ? "Hindi" : "English",
        facts: form.facts,
      };

      const { data } = await api.post("/Documents/generate", payload);

      if (data?.id) {
        navigate(`/documents/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      alert(isHindi ? "मसौदा नहीं बन सका।" : "Failed to generate draft.");
    } finally {
      setLoading(false);
    }
  };

  const insertClause = (content: string) => {
    setForm((prev) => ({
      ...prev,
      facts: prev.facts ? `${prev.facts}\n\n${content}` : content,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {isCopilotDraft
                  ? "Copilot Editor"
                  : isHindi
                    ? "एआई मसौदा"
                    : "AI Drafts"}
              </h1>

              <p className="text-slate-500">
                {isCopilotDraft
                  ? isHindi
                    ? "Copilot द्वारा तैयार सामग्री को संपादित करें।"
                    : "Edit the content generated by DraftLex Copilot."
                  : isHindi
                    ? "कोर्ट-रेडी कानूनी मसौदा तैयार करें।"
                    : "Generate court-ready legal drafts using DraftLex AI."}
              </p>
            </div>

            <UserMenu />
          </div>

          {/* Main Card */}

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Matter */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  {isHindi ? "मामला चुनें *" : "Select Matter *"}
                </label>

                <select
                  value={form.matterId}
                  onChange={(e) => selectMatter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3"
                >
                  <option value="">
                    {isHindi ? "मामला चुनें" : "Select a Matter"}
                  </option>

                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.matterNumber} • {matter.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isHindi ? "दस्तावेज़ प्रकार" : "Document Type"}
                </label>

                <select
                  value={form.documentType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      documentType: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                >
                  {templates.map((t) => (
                    <option key={t.value} value={t.value}>
                      {isHindi ? t.hi : t.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Language */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isHindi ? "मसौदा भाषा" : "Draft Language"}
                </label>

                <div className="rounded-lg border border-slate-300 bg-slate-100 p-3 font-medium">
                  {isHindi ? "हिन्दी (कोर्ट-रेडी)" : "English (Court-Ready)"}
                </div>
              </div>

              {/* Client */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isHindi ? "मुवक्किल" : "Client Name"}
                </label>

                <input
                  value={form.clientName}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3"
                />
              </div>

              {/* Matter */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isHindi ? "मामले का शीर्षक" : "Matter Title"}
                </label>

                <input
                  value={form.matterTitle}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3"
                />
              </div>

              {/* Court */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isHindi ? "न्यायालय" : "Court"}
                </label>

                <input
                  value={form.court}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3"
                />
              </div>
            </div>

            {/* Facts */}

            <div className="mt-6 flex items-center justify-between">
              <label className="text-sm font-medium">
                {isCopilotDraft
                  ? isHindi
                    ? "Copilot सामग्री"
                    : "Copilot Content"
                  : isHindi
                    ? "मामले के तथ्य"
                    : "Facts of the Case"}
              </label>
              {loadingFacts && (
                <span className="text-xs text-blue-600">Loading...</span>
              )}

              <button
                type="button"
                onClick={() => setShowClauseLibrary(true)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                title="Ctrl + Shift + I"
              >
                <BookOpen size={18} />
                {isHindi ? "क्लॉज़ लाइब्रेरी" : "Clause Library"}
              </button>
            </div>

            <textarea
              rows={10}
              value={form.facts}
              onChange={(e) =>
                setForm({
                  ...form,
                  facts: e.target.value,
                })
              }
              placeholder={
                isCopilotDraft
                  ? isHindi
                    ? "Copilot द्वारा तैयार सामग्री यहाँ संपादित करें..."
                    : "Edit the Copilot-generated content here..."
                  : isHindi
                    ? "यहाँ केवल तथ्य लिखिए। एआई स्वयं कोर्ट-रेडी मसौदा तैयार करेगा।"
                    : "Describe the facts or insert ready-made clauses..."
              }
              className="mt-2 w-full rounded-lg border border-slate-300 p-4"
            />

            {/* Court Ready Preview */}

            {!isCopilotDraft && (
            <div className="mt-8 rounded-xl bg-blue-50 p-5">
              <div className="mb-2 flex items-center gap-2 font-semibold text-blue-800">
                <Sparkles size={18} />
                {isHindi
                  ? "कोर्ट-रेडी मसौदा में शामिल होगा"
                  : "Your generated draft will include"}
              </div>

              <ul className="space-y-2 text-sm text-blue-700">
                <li>
                  •{" "}
                  {isHindi ? "उचित कानूनी प्रारूप" : "Proper legal formatting"}
                </li>
                <li>
                  •{" "}
                  {isHindi
                    ? "दिनांक एवं पक्षकार विवरण"
                    : "Party and date details"}
                </li>
                <li>
                  •{" "}
                  {isHindi
                    ? "तथ्यों का क्रमबद्ध विवरण"
                    : "Structured facts section"}
                </li>
                <li>
                  •{" "}
                  {isHindi ? "प्रासंगिक कानूनी आधार" : "Relevant legal grounds"}
                </li>
                <li>• {isHindi ? "अंतिम प्रार्थना" : "Final prayer clause"}</li>
              </ul>
            </div>
            )}

            {/* Generate */}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={generateDraft}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}

                {loading
                  ? isHindi
                    ? "मसौदा बन रहा है..."
                    : "Generating..."
                  : isHindi
                    ? "कोर्ट-रेडी मसौदा बनाएँ"
                    : "Generate Court-Ready Draft"}
              </button>
            </div>
          </div>
        </main>
      </div>

      <ClauseLibraryModal
        open={showClauseLibrary}
        onClose={() => setShowClauseLibrary(false)}
        onInsert={insertClause}
      />
    </div>
  );
}
