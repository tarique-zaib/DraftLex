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
  ImageIcon,
  FileBadge,
  File,
  Download,
  Trash2,
  Eye,
  IndianRupee,
  CreditCard,
  PlusCircle,
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

function formatFinancialDate(date: string) {
  return new Date(date).toLocaleDateString(
    i18n.language.startsWith("hi") ? "hi-IN" : "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

interface FinancialSummary {
  matterId: string;
  totalCharges: number;
  amountReceived: number;
  outstanding: number;
  overpaidAmount: number;
  status: string;
}

interface MatterFee {
  id: string;
  matterId: string;
  feeType: string;
  fixedFee: number;
  dailyRate: number;
  hourlyRate: number;
  appearanceRate: number;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

interface MatterFeeEntry {
  id: string;
  matterId: string;
  matterFeeId?: string | null;
  hearingId?: string | null;
  chargeDate: string;
  chargeType: string;
  description: string;
  amount: number;
  hours?: number | null;
  remarks?: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string | null;
  remarks?: string | null;
  createdAt: string;
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

  // Financials
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);

  const [matterFee, setMatterFee] = useState<MatterFee | null>(null);
  const [charges, setCharges] = useState<MatterFeeEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [financialLoading, setFinancialLoading] = useState(false);

  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);

  const [savingCharge, setSavingCharge] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingFee, setSavingFee] = useState(false);

  // Charge form
  const [chargeDate, setChargeDate] = useState("");
  const [chargeType, setChargeType] = useState("Daily");
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeHours, setChargeHours] = useState("");
  const [chargeRemarks, setChargeRemarks] = useState("");

  // Payment form
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Fee configuration form
  const [feeType, setFeeType] = useState("Daily");
  const [fixedFee, setFixedFee] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [appearanceRate, setAppearanceRate] = useState("");
  const [feeNotes, setFeeNotes] = useState("");

  const loadFinancials = async () => {
    if (!id) return;

    try {
      setFinancialLoading(true);

      const [summaryResult, feeResult, chargesResult, paymentsResult] =
        await Promise.allSettled([
          api.get<FinancialSummary>(`/matters/${id}/financial-summary`),
          api.get<MatterFee>(`/matters/${id}/fee`),
          api.get<MatterFeeEntry[]>(`/matters/${id}/charges`),
          api.get<Payment[]>(`/matters/${id}/payments`),
        ]);

      if (summaryResult.status === "fulfilled") {
        setFinancialSummary(summaryResult.value.data);
      }

      if (feeResult.status === "fulfilled") {
        setMatterFee(feeResult.value.data);

        setFeeType(feeResult.value.data.feeType);
        setFixedFee(String(feeResult.value.data.fixedFee ?? 0));
        setDailyRate(String(feeResult.value.data.dailyRate ?? 0));
        setHourlyRate(String(feeResult.value.data.hourlyRate ?? 0));
        setAppearanceRate(String(feeResult.value.data.appearanceRate ?? 0));
        setFeeNotes(feeResult.value.data.notes ?? "");
      }

      if (chargesResult.status === "fulfilled") {
        setCharges(chargesResult.value.data);
      }

      if (paymentsResult.status === "fulfilled") {
        setPayments(paymentsResult.value.data);
      }
    } catch (err) {
      console.error("Failed to load financials", err);
    } finally {
      setFinancialLoading(false);
    }
  };

  const addCharge = async () => {
    if (!id) return;

    if (!chargeDescription.trim()) {
      alert("Please enter charge description.");
      return;
    }

    const amount = Number(chargeAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid charge amount.");
      return;
    }

    if (chargeType === "Hourly") {
      const hours = Number(chargeHours);

      if (!hours || hours <= 0) {
        alert("Please enter valid hours.");
        return;
      }
    }

    try {
      setSavingCharge(true);

      await api.post(`/matters/${id}/charges`, {
        chargeDate: chargeDate || new Date().toISOString().split("T")[0],

        chargeType,

        description: chargeDescription,

        amount,

        hours: chargeType === "Hourly" ? Number(chargeHours) : null,

        remarks: chargeRemarks || null,
      });

      setShowChargeModal(false);

      resetChargeForm();

      await loadFinancials();
    } catch (err) {
      console.error(err);

      alert("Failed to add charge.");
    } finally {
      setSavingCharge(false);
    }
  };

  const resetChargeForm = () => {
    setChargeDate(new Date().toISOString().split("T")[0]);
    setChargeType("Daily");
    setChargeDescription("");
    setChargeAmount("");
    setChargeHours("");
    setChargeRemarks("");
  };

  const addPayment = async () => {
    if (!id) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    try {
      setSavingPayment(true);

      await api.post(`/matters/${id}/payments`, {
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],

        amount,

        paymentMode,

        referenceNumber: paymentReference || null,

        remarks: paymentRemarks || null,
      });

      setShowPaymentModal(false);

      resetPaymentForm();

      await loadFinancials();
    } catch (err) {
      console.error(err);

      alert("Failed to record payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentAmount("");
    setPaymentMode("UPI");
    setPaymentReference("");
    setPaymentRemarks("");
  };

  const saveFeeConfiguration = async () => {
    if (!id) return;

    try {
      setSavingFee(true);

      const payload = {
        feeType,
        fixedFee: Number(fixedFee || 0),
        dailyRate: Number(dailyRate || 0),
        hourlyRate: Number(hourlyRate || 0),
        appearanceRate: Number(appearanceRate || 0),
        notes: feeNotes || null,
      };

      if (matterFee) {
        await api.put(`/matters/${id}/fee`, payload);
      } else {
        await api.post(`/matters/${id}/fee`, payload);
      }

      setShowFeeModal(false);

      await loadFinancials();
    } catch (err) {
      console.error(err);

      alert("Failed to save fee configuration.");
    } finally {
      setSavingFee(false);
    }
  };

  const deleteCharge = async (chargeId: string) => {
    if (!id) return;

    if (!confirm("Delete this charge?")) return;

    try {
      await api.delete(`/matters/${id}/charges/${chargeId}`);
      await loadFinancials();
    } catch (err) {
      console.error(err);
      alert("Failed to delete charge.");
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!id) return;

    if (!confirm("Delete this payment?")) return;

    try {
      await api.delete(`/matters/${id}/payments/${paymentId}`);
      await loadFinancials();
    } catch (err) {
      console.error(err);
      alert("Failed to delete payment.");
    }
  };

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

  const deleteEvidence = async (documentId: string) => {
    if (
      !confirm(
        i18n.language.startsWith("hi")
          ? "क्या आप यह साक्ष्य हटाना चाहते हैं?"
          : "Delete this evidence?",
      )
    )
      return;

    try {
      await api.delete(`/Documents/${documentId}`);

      if (!id) return;

      const docs = await getDocumentsByMatter(id);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      alert(
        i18n.language.startsWith("hi")
          ? "हटाया नहीं जा सका।"
          : "Delete failed.",
      );
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();

    if (ext === "pdf") return <FileText className="text-red-600" size={28} />;

    if (["jpg", "jpeg", "png"].includes(ext || ""))
      return <ImageIcon className="text-blue-600" size={28} />;

    if (ext === "docx")
      return <FileBadge className="text-indigo-600" size={28} />;

    return <File className="text-slate-600" size={28} />;
  };

  const fileUrl = (content: string) =>
    `${api.defaults.baseURL?.replace("/api", "")}/uploads/evidence/${content.replace(/<[^>]*>/g, "").trim()}`;

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
        await loadFinancials();

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

  // Get the latest hearing stage
  const latestHearing = [...hearings].sort(
    (a, b) =>
      new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime(),
  )[0];

  const currentStage = latestHearing?.stage ?? matter.status;

  const progressMap: Record<string, number> = {
    Filed: 10,
    "Notice Issued": 25,
    "Reply Filed": 40,
    Evidence: 55,
    "Cross Examination": 70,
    "Final Arguments": 90,
    "Judgment Reserved": 95,
    Disposed: 100,
    Closed: 100,
  };

  const progress = progressMap[currentStage] ?? 15;

  const getFinancialStatusClass = (status?: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";

      case "Partially Paid":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "Overpaid":
        return "bg-blue-100 text-blue-700 border-blue-200";

      case "Unpaid":
      default:
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

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

          {/* FINANCIALS */}
          <Section
            title={
              i18n.language.startsWith("hi") ? "वित्तीय विवरण" : "Financials"
            }
            icon={<IndianRupee size={20} />}
          >
            {financialLoading ? (
              <div className="rounded-lg bg-slate-50 p-6 text-center text-slate-500">
                Loading financial information...
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <FinancialCard
                    label="Total Charges"
                    value={financialSummary?.totalCharges ?? 0}
                  />

                  <FinancialCard
                    label="Amount Received"
                    value={financialSummary?.amountReceived ?? 0}
                  />

                  <FinancialCard
                    label="Outstanding"
                    value={financialSummary?.outstanding ?? 0}
                  />
                </div>

                {/* Status */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Payment Status
                    </p>

                    <div
                      className={`mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${getFinancialStatusClass(
                        financialSummary?.status,
                      )}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />

                      {financialSummary?.status ?? "Unpaid"}
                    </div>
                  </div>

                  {(financialSummary?.overpaidAmount ?? 0) > 0 && (
                    <div className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                      Overpaid: ₹
                      {(financialSummary?.overpaidAmount ?? 0).toLocaleString(
                        "en-IN",
                      )}
                    </div>
                  )}
                </div>

                {/* Fee Configuration */}
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Fee Configuration
                      </h3>

                      {matterFee ? (
                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                            {matterFee.feeType}
                          </span>

                          {matterFee.feeType === "Daily" && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              ₹{matterFee.dailyRate.toLocaleString("en-IN")} /
                              day
                            </span>
                          )}

                          {matterFee.feeType === "Hourly" && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              ₹{matterFee.hourlyRate.toLocaleString("en-IN")} /
                              hour
                            </span>
                          )}

                          {matterFee.feeType === "PerAppearance" && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              ₹
                              {matterFee.appearanceRate.toLocaleString("en-IN")}{" "}
                              / appearance
                            </span>
                          )}

                          {matterFee.feeType === "Fixed" && (
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              ₹{matterFee.fixedFee.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">
                          No fee configuration added.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setShowFeeModal(true)}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                      <Pencil size={16} />
                      {matterFee ? "Edit Fee" : "Set Fee"}
                    </button>
                  </div>
                </div>

                {/* Charges */}
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">Charges</h3>

                    <div className="flex flex-wrap gap-2">
                      {matterFee?.feeType === "Daily" && (
                        <button
                          onClick={() => {
                            setChargeDate(
                              new Date().toISOString().split("T")[0],
                            );

                            setChargeType("Daily");

                            setChargeDescription(
                              "Daily advocate professional fee",
                            );

                            setChargeAmount(String(matterFee.dailyRate));

                            setChargeHours("");

                            setChargeRemarks("");

                            setShowChargeModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <PlusCircle size={16} />
                          Daily Charge ₹
                          {matterFee.dailyRate.toLocaleString("en-IN")}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          resetChargeForm();
                          setShowChargeModal(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <PlusCircle size={16} />
                        Add Charge
                      </button>
                    </div>
                  </div>

                  {charges.length === 0 ? (
                    <EmptyCard text="No charges recorded." />
                  ) : (
                    <div className="space-y-2">
                      {charges.map((charge) => (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {charge.description}
                            </p>

                            <p className="text-xs text-slate-500">
                              {formatFinancialDate(charge.chargeDate)} •{" "}
                              {charge.chargeType}
                              {charge.hours
                                ? ` • ${charge.hours} hour${
                                    charge.hours === 1 ? "" : "s"
                                  }`
                                : ""}
                            </p>

                            {charge.remarks && (
                              <p className="mt-1 text-xs text-slate-400">
                                {charge.remarks}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-semibold">
                              ₹{charge.amount.toLocaleString("en-IN")}
                            </span>

                            <button
                              onClick={() => deleteCharge(charge.id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payments */}
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Payments</h3>

                    <button
                      onClick={() => {
                        resetPaymentForm();
                        setShowPaymentModal(true);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <CreditCard size={16} />
                      Record Payment
                    </button>
                  </div>

                  {payments.length === 0 ? (
                    <EmptyCard text="No payments recorded." />
                  ) : (
                    <div className="space-y-2">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {payment.paymentMode}
                            </p>

                            <p className="text-xs text-slate-500">
                              {formatFinancialDate(payment.paymentDate)}
                              {payment.referenceNumber
                                ? ` • Ref: ${payment.referenceNumber}`
                                : ""}
                            </p>

                            {payment.remarks && (
                              <p className="mt-1 text-xs text-slate-400">
                                {payment.remarks}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-green-700">
                              ₹{payment.amount.toLocaleString("en-IN")}
                            </span>

                            <button
                              onClick={() => deletePayment(payment.id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </Section>

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
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        {/* Left */}
                        <div className="flex gap-4">
                          <div className="rounded-lg bg-slate-100 p-3">
                            {getFileIcon(d.content)}
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {d.title}
                            </h3>

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

                            {d.matterTitle && (
                              <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                {d.matterTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/documents/${d.id}`)}
                            className="rounded-lg p-2 hover:bg-slate-100"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>

                          <a
                            href={fileUrl(d.content)}
                            download={d.title}
                            className="rounded-lg p-2 hover:bg-slate-100"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>

                          <button
                            onClick={() => deleteEvidence(d.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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

      {/* Add Charge Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Charge</h2>

              <button
                onClick={() => setShowChargeModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Charge Date
                </label>

                <input
                  type="date"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Charge Type
                </label>

                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Daily">Daily</option>
                  <option value="Appearance">Appearance</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>

                <input
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  placeholder="e.g. Daily advocate professional fee"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Amount (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                {chargeType === "Hourly" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Hours
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={chargeHours}
                      onChange={(e) => setChargeHours(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Remarks
                </label>

                <textarea
                  value={chargeRemarks}
                  onChange={(e) => setChargeRemarks(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={addCharge}
                  disabled={savingCharge}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {savingCharge ? "Saving..." : "Add Charge"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Record Payment</h2>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Date
                </label>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Amount (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Mode
                </label>

                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reference Number
                </label>

                <input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="UPI / transaction / cheque number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Remarks
                </label>

                <textarea
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={addPayment}
                  disabled={savingPayment}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-slate-400"
                >
                  {savingPayment ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Configuration Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {matterFee ? "Edit Fee Configuration" : "Set Fee Configuration"}
              </h2>

              <button
                onClick={() => setShowFeeModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Fee Type
                </label>

                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Daily">Daily</option>
                  <option value="Hourly">Hourly</option>
                  <option value="PerAppearance">Per Appearance</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {feeType === "Fixed" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Fixed Fee (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              )}

              {feeType === "Daily" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Daily Rate (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              )}

              {feeType === "Hourly" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Hourly Rate (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              )}

              {feeType === "PerAppearance" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Appearance Rate (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={appearanceRate}
                    onChange={(e) => setAppearanceRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>

                <textarea
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowFeeModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={saveFeeConfiguration}
                  disabled={savingFee}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {savingFee ? "Saving..." : "Save Fee"}
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

function FinancialCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        ₹{value.toLocaleString("en-IN")}
      </p>
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
