import i18n from "../i18n";
import { useEffect, useState } from "react";
import {
  X,
  User,
  Scale,
  Shield,
  Home,
  Users,
  Briefcase,
  Building,
  Gavel,
  FileText,
  Loader2,
} from "lucide-react";
import api from "../api/client";

interface Client {
  id: string;
  fullName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const matterTypes = [
  { value: "Civil", hi: "दीवानी", icon: Scale },
  { value: "Criminal", hi: "आपराधिक", icon: Shield },
  { value: "Family", hi: "पारिवारिक", icon: Users },
  { value: "Consumer", hi: "उपभोक्ता", icon: Briefcase },
  { value: "Labour", hi: "श्रम", icon: Building },
  { value: "Property", hi: "संपत्ति", icon: Home },
];

export default function NewMatterModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const isHindi = i18n.language.startsWith("hi");

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [errors, setErrors] = useState({
    clientId: "",
    title: "",
  });

  const [form, setForm] = useState({
    clientId: "",
    title: "",
    matterNumber: "",
    caseNumber: "",
    matterType: "Civil",
    court: "",
    judgeName: "",
    status: "Active",
    oppositePartyName: "",
    oppositePartyAddress: "",
  });

  useEffect(() => {
    if (!open) return;

    api
      .get("/Clients")
      .then((r) => setClients(r.data))
      .catch(console.error);
  }, [open]);

  if (!open) return null;

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = { clientId: "", title: "" };
    let valid = true;

    if (!form.clientId) {
      next.clientId = isHindi
        ? "कृपया मुवक्किल चुनें।"
        : "Please select a client.";
      valid = false;
    }

    if (!form.title.trim()) {
      next.title = isHindi
        ? "कृपया मामले का शीर्षक दर्ज करें।"
        : "Please enter matter title.";
      valid = false;
    }

    setErrors(next);
    return valid;
  };

  const save = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await api.post("/Matters", form);

      onCreated();
      onClose();

      setForm({
        clientId: "",
        title: "",
        matterNumber: "",
        caseNumber: "",
        matterType: "Civil",
        court: "",
        judgeName: "",
        status: "Active",
        oppositePartyName: "",
        oppositePartyAddress: "",
      });

      setErrors({
        clientId: "",
        title: "",
      });
    } catch (e) {
      console.error(e);
      alert(isHindi ? "मामला नहीं बनाया जा सका।" : "Unable to create matter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b bg-white p-6">
          <div>
            <h2 className="text-2xl font-bold">
              {isHindi ? "नया मामला" : "New Matter"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isHindi
                ? "न्यायालय हेतु नया मामला दर्ज करें।"
                : "Create a new court matter."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Body */}

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Client */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "मुवक्किल *" : "Client *"}
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3">
              <User className="text-slate-400" size={18} />

              <select
                value={form.clientId}
                onChange={(e) => update("clientId", e.target.value)}
                className="w-full p-3 outline-none"
              >
                <option value="">
                  {isHindi ? "मुवक्किल चुनें" : "Select Client"}
                </option>

                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
            )}
          </div>

          {/* Matter Title */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "मामले का शीर्षक *" : "Matter Title *"}
            </label>

            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder={
                isHindi
                  ? "जैसे: राहुल बनाम मोहन"
                  : "Example: Rahul vs Mohan"
              }
              className="w-full rounded-lg border border-slate-300 p-3"
            />

            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Matter Types */}

          <div>
            <label className="mb-3 block text-sm font-medium">
              {isHindi ? "मामले का प्रकार" : "Matter Type"}
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              {matterTypes.map((type) => {
                const Icon = type.icon;
                const active = form.matterType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update("matterType", type.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      size={24}
                      className={active ? "text-blue-600" : "text-slate-600"}
                    />

                    <p className="mt-2 font-medium">
                      {isHindi ? type.hi : type.value}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Case + Court */}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {isHindi ? "केस नंबर" : "Case Number"}
              </label>

              <input
                value={form.caseNumber}
                onChange={(e) => update("caseNumber", e.target.value)}
                placeholder={isHindi ? "यदि उपलब्ध हो" : "If available"}
                className="w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {isHindi ? "न्यायालय" : "Court"}
              </label>

              <input
                value={form.court}
                onChange={(e) => update("court", e.target.value)}
                placeholder={
                  isHindi
                    ? "जिला न्यायालय गाज़ियाबाद"
                    : "District Court Ghaziabad"
                }
                className="w-full rounded-lg border border-slate-300 p-3"
              />
            </div>
          </div>

          {/* Judge */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "न्यायाधीश" : "Judge"}
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3">
              <Gavel className="text-slate-400" size={18} />

              <input
                value={form.judgeName}
                onChange={(e) => update("judgeName", e.target.value)}
                placeholder={
                  isHindi ? "न्यायाधीश का नाम" : "Judge Name"
                }
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          {/* Opposite Party */}

          <div className="rounded-xl border bg-slate-50 p-5">
            <h3 className="mb-4 font-semibold text-slate-800">
              {isHindi ? "विपक्षी पक्ष" : "Opposite Party"}
            </h3>

            <input
              value={form.oppositePartyName}
              onChange={(e) =>
                update("oppositePartyName", e.target.value)
              }
              placeholder={
                isHindi
                  ? "विपक्षी पक्ष का नाम"
                  : "Opposite Party Name"
              }
              className="mb-3 w-full rounded-lg border border-slate-300 p-3"
            />

            <textarea
              rows={3}
              value={form.oppositePartyAddress}
              onChange={(e) =>
                update("oppositePartyAddress", e.target.value)
              }
              placeholder={
                isHindi
                  ? "विपक्षी पक्ष का पता"
                  : "Opposite Party Address"
              }
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          {/* Info */}

          <div className="rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <FileText size={18} />

              <span className="font-medium">
                {isHindi
                  ? "मामला नंबर और स्थिति स्वतः निर्धारित होगी"
                  : "Matter Number and Status are handled automatically"}
              </span>
            </div>

            <p className="mt-1 text-sm text-blue-600">
              {isHindi
                ? "नया मामला 'सक्रिय' स्थिति के साथ बनाया जाएगा।"
                : "New matters are created as Active by default."}
            </p>
          </div>
        </div>

        {/* Sticky Footer */}

        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-6">
          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-3 hover:bg-slate-50"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Scale size={18} />
            )}

            {loading
              ? isHindi
                ? "बनाया जा रहा है..."
                : "Creating..."
              : isHindi
                ? "मामला बनाएँ"
                : "Create Matter"}
          </button>
        </div>
      </div>
    </div>
  );
}