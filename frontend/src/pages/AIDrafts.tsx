import i18n from "../i18n";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Loader2, BookOpen } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import ClauseLibraryModal from "../components/ClauseLibraryModal";

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
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    initialize();

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [searchParams]);

  const selectMatter = (id: string) => {
    const matter = matters.find((m) => m.id === id);

    setForm((prev) => ({
      ...prev,
      matterId: id,
      clientName: matter?.client?.fullName ?? "",
      matterTitle: matter?.title ?? "",
      court: matter?.court ?? "",
    }));
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
      alert(isHindi ? "ड्राफ्ट नहीं बन सका।" : "Failed to generate draft.");
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
                {isHindi ? "एआई ड्राफ्ट" : "AI Drafts"}
              </h1>

              <p className="text-slate-500">
                {isHindi
                  ? "कोर्ट-रेडी कानूनी ड्राफ्ट तैयार करें।"
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
                  {isHindi ? "ड्राफ्ट भाषा" : "Draft Language"}
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
                {isHindi ? "मामले के तथ्य" : "Facts of the Case"}
              </label>

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
                isHindi
                  ? "यहाँ केवल तथ्य लिखिए। एआई स्वयं कोर्ट-रेडी ड्राफ्ट तैयार करेगा।"
                  : "Describe the facts or insert ready-made clauses..."
              }
              className="mt-2 w-full rounded-lg border border-slate-300 p-4"
            />

            {/* Court Ready Preview */}

            <div className="mt-8 rounded-xl bg-blue-50 p-5">
              <div className="mb-2 flex items-center gap-2 font-semibold text-blue-800">
                <Sparkles size={18} />
                {isHindi
                  ? "कोर्ट-रेडी ड्राफ्ट में शामिल होगा"
                  : "Your generated draft will include"}
              </div>

              <ul className="space-y-2 text-sm text-blue-700">
                <li>• {isHindi ? "उचित कानूनी प्रारूप" : "Proper legal formatting"}</li>
                <li>• {isHindi ? "दिनांक एवं पक्षकार विवरण" : "Party and date details"}</li>
                <li>• {isHindi ? "तथ्यों का क्रमबद्ध विवरण" : "Structured facts section"}</li>
                <li>• {isHindi ? "प्रासंगिक कानूनी आधार" : "Relevant legal grounds"}</li>
                <li>• {isHindi ? "अंतिम प्रार्थना" : "Final prayer clause"}</li>
              </ul>
            </div>

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
                    ? "ड्राफ्ट बन रहा है..."
                    : "Generating..."
                  : isHindi
                    ? "कोर्ट-रेडी ड्राफ्ट बनाएँ"
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