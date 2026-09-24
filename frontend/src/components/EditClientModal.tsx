import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/client";
import i18n from "../i18n";

interface Client {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  notes?: string;
}

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditClientModal({
  open,
  client,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (!client) return;

    setForm({
      fullName: client.fullName,
      mobile: client.mobile,
      email: client.email,
      address: client.address,
      notes: client.notes || "",
    });
  }, [client]);

  if (!open || !client) return null;

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    try {
      setLoading(true);

      await api.put(`/Clients/${client.id}`, form);

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Unable to update client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-semibold">{i18n.t("editClient")}</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <input
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="w-full rounded-lg border p-3"
            placeholder={i18n.t("fullName")}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.mobile}
              onChange={(e) => update("mobile", e.target.value)}
              className="rounded-lg border p-3"
              placeholder={i18n.t("mobile")}
            />

            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="rounded-lg border p-3"
              placeholder={i18n.t("email")}
            />
          </div>

          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded-lg border p-3"
            placeholder={i18n.t("address")}
          />

          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg border p-3"
            rows={4}
            placeholder={i18n.t("notes")}
          />
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2"
          >
            {i18n.t("cancel")}
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            {loading ? i18n.t("saving") : i18n.t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}