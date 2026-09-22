import { useState } from "react";
import { X } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    notes: "",
  });

  if (!open) return null;

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.fullName.trim()) {
      alert("Client name is required.");
      return;
    }

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

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Unable to create client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-semibold">New Client</h2>

          <button onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <input
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Mobile"
              value={form.mobile}
              onChange={(e) => update("mobile", e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="rounded-lg border p-3"
            />
          </div>

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <textarea
            placeholder="Notes"
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}