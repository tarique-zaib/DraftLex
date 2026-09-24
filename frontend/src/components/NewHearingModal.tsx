import { useEffect, useState } from "react";
import {
  Scale,
  CalendarDays,
  Clock3,
  Gavel,
  MapPin,
  FileText,
} from "lucide-react";
import api from "../api/client";
import AppModal from "./AppModal";
import i18n from "../i18n";

interface Matter {
  id: string;
  title: string;
  matterNumber: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const stages = [
  {
    value: "First Hearing",
    icon: Clock3,
    label: { en: "First Hearing", hi: "प्रथम सुनवाई" },
  },
  {
    value: "Evidence",
    icon: Clock3,
    label: { en: "Evidence", hi: "साक्ष्य" },
  },
  {
    value: "Arguments",
    icon: Clock3,
    label: { en: "Arguments", hi: "बहस" },
  },
  {
    value: "Cross Examination",
    icon: Clock3,
    label: { en: "Cross Examination", hi: "जिरह" },
  },
  {
    value: "Final Order",
    icon: Clock3,
    label: { en: "Final Order", hi: "अंतिम आदेश" },
  },
];

export default function NewHearingModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);

  const [form, setForm] = useState({
    matterId: "",
    hearingDate: "",
    stage: "First Hearing",
    judgeName: "",
    courtRoom: "",
    remarks: "",
  });

  useEffect(() => {
    if (!open) return;

    api
      .get("/Matters")
      .then((r) => setMatters(r.data))
      .catch(console.error);
  }, [open]);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const reset = () =>
    setForm({
      matterId: "",
      hearingDate: "",
      stage: "First Hearing",
      judgeName: "",
      courtRoom: "",
      remarks: "",
    });

  const save = async () => {
    if (!form.matterId || !form.hearingDate) {
      alert(
        i18n.language.startsWith("hi")
          ? "मामला और सुनवाई की तारीख आवश्यक है।"
          : "Matter and Hearing Date are required.",
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/Hearings", form);

      onCreated();
      onClose();
      reset();
    } catch (e) {
      console.error(e);
      alert(
        i18n.language.startsWith("hi")
          ? "सुनवाई निर्धारित नहीं हो सकी।"
          : "Unable to schedule hearing.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title={i18n.language.startsWith("hi") ? "नई सुनवाई" : "Schedule Hearing"}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2 hover:bg-slate-50"
          >
            {i18n.language.startsWith("hi") ? "रद्द करें" : "Cancel"}
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CalendarDays size={18} />

            {loading
              ? i18n.language.startsWith("hi")
                ? "सहेजा जा रहा है..."
                : "Saving..."
              : i18n.language.startsWith("hi")
                ? "सुनवाई निर्धारित करें"
                : "Schedule Hearing"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Matter */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            {i18n.language.startsWith("hi") ? "मामला *" : "Matter *"}
          </label>

          <div className="relative">
            <Scale
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={form.matterId}
              onChange={(e) => update("matterId", e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
            >
              <option value="">
                {i18n.language.startsWith("hi")
                  ? "मामला चुनें"
                  : "Select Matter"}
              </option>

              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.matterNumber} • {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            {i18n.language.startsWith("hi")
              ? "सुनवाई की तिथि एवं समय *"
              : "Hearing Date & Time *"}
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="datetime-local"
              value={form.hearingDate}
              onChange={(e) => update("hearingDate", e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Stage */}

        <div>
          <label className="mb-3 block text-sm font-medium">
            {i18n.language.startsWith("hi")
              ? "सुनवाई का चरण"
              : "Hearing Stage"}
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const active = form.stage === stage.value;

              return (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => update("stage", stage.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    size={22}
                    className={active ? "text-blue-600" : "text-slate-500"}
                  />

                  <p className="mt-3 font-medium">
                    {i18n.language.startsWith("hi")
                      ? stage.label.hi
                      : stage.label.en}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Judge + Court */}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {i18n.language.startsWith("hi") ? "न्यायाधीश" : "Judge"}
            </label>

            <div className="relative">
              <Gavel
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                placeholder={
                  i18n.language.startsWith("hi")
                    ? "न्यायाधीश का नाम"
                    : "Judge Name"
                }
                value={form.judgeName}
                onChange={(e) => update("judgeName", e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {i18n.language.startsWith("hi")
                ? "न्यायालय कक्ष"
                : "Court Room"}
            </label>

            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                placeholder={
                  i18n.language.startsWith("hi")
                    ? "कोर्ट नं. 4"
                    : "Court No. 4"
                }
                value={form.courtRoom}
                onChange={(e) => update("courtRoom", e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Remarks */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            {i18n.language.startsWith("hi") ? "टिप्पणियाँ" : "Remarks"}
          </label>

          <div className="relative">
            <FileText
              size={18}
              className="absolute left-3 top-4 text-slate-400"
            />

            <textarea
              rows={4}
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              placeholder={
                i18n.language.startsWith("hi")
                  ? "कोई अतिरिक्त टिप्पणी..."
                  : "Additional notes..."
              }
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </AppModal>
  );
}