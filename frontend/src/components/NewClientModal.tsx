import i18n from "../i18n";
import { useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Loader2,
  FileText,
} from "lucide-react";
import api from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewClientModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const isHindi = i18n.language.startsWith("hi");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    notes: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    mobile: "",
  });

  if (!open) return null;

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = { fullName: "", mobile: "" };
    let valid = true;

    if (!form.fullName.trim()) {
      next.fullName = isHindi
        ? "कृपया मुवक्किल का नाम दर्ज करें।"
        : "Please enter client name.";
      valid = false;
    }

    if (form.mobile && !/^\d{10}$/.test(form.mobile)) {
      next.mobile = isHindi
        ? "10 अंकों का मोबाइल नंबर दर्ज करें।"
        : "Enter a valid 10-digit mobile number.";
      valid = false;
    }

    setErrors(next);
    return valid;
  };

  const save = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await api.post("/Clients", form);

      setForm({
        fullName: "",
        mobile: "",
        email: "",
        address: "",
        notes: "",
      });

      setErrors({
        fullName: "",
        mobile: "",
      });

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert(isHindi ? "मुवक्किल नहीं जोड़ा जा सका।" : "Unable to create client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isHindi ? "नया मुवक्किल जोड़ें" : "New Client"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isHindi
                ? "मुवक्किल का विवरण दर्ज करें।"
                : "Enter client details."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {/* Full Name */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "मुवक्किल का नाम *" : "Client Name *"}
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <User className="text-slate-400" size={18} />

              <input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder={isHindi ? "पूरा नाम" : "Full Name"}
                className="w-full p-3 outline-none"
              />
            </div>

            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Mobile */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "मोबाइल नंबर" : "Mobile Number"}
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <Phone className="text-slate-400" size={18} />

              <input
                value={form.mobile}
                maxLength={10}
                onChange={(e) =>
                  update("mobile", e.target.value.replace(/\D/g, ""))
                }
                placeholder="98XXXXXXXX"
                className="w-full p-3 outline-none"
              />
            </div>

            {errors.mobile && (
              <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
            )}
          </div>

          {/* Email */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "ईमेल (वैकल्पिक)" : "Email (Optional)"}
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <Mail className="text-slate-400" size={18} />

              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          {/* Address */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "पता" : "Address"}
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <MapPin className="text-slate-400" size={18} />

              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder={isHindi ? "पूरा पता" : "Address"}
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          {/* Notes */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              {isHindi ? "नोट्स" : "Notes"}
            </label>

            <div className="flex rounded-lg border border-slate-300 px-3 focus-within:border-blue-500">
              <StickyNote className="mt-3 text-slate-400" size={18} />

              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder={
                  isHindi
                    ? "कोई अतिरिक्त जानकारी..."
                    : "Additional information..."
                }
                className="w-full resize-none p-3 outline-none"
              />
            </div>
          </div>

          {/* Auto Client Code */}

          <div className="md:col-span-2 rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <FileText size={18} />

              <span className="font-medium">
                {isHindi
                  ? "क्लाइंट कोड स्वतः बनाया जाएगा"
                  : "Client Code will be generated automatically"}
              </span>
            </div>

            <p className="mt-1 text-sm text-blue-600">
              {isHindi
                ? "उदाहरण: CLI-2026-0013"
                : "Example: CLI-2026-0013"}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-3 hover:bg-slate-50"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <User size={18} />
            )}

            {loading
              ? isHindi
                ? "जोड़ा जा रहा है..."
                : "Creating..."
              : isHindi
                ? "मुवक्किल जोड़ें"
                : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}