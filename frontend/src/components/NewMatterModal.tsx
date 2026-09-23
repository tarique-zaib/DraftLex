import { useEffect, useState } from "react";
import { X } from "lucide-react";
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

export default function NewMatterModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    title: "",
    matterNumber: "",
    caseNumber: "",
    matterType: "Civil",
    court: "",
    judgeName: "",
    status: "Active",

    // NEW
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

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.clientId || !form.title.trim()) {
      alert("Client and Matter Title are required.");
      return;
    }

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
    } catch (e) {
      console.error(e);
      alert("Unable to create matter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-semibold">New Matter</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <select
            value={form.clientId}
            onChange={(e) => update("clientId", e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="">Select Client</option>

            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>

          <input
            placeholder="Matter Title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              placeholder="Matter Number"
              value={form.matterNumber}
              onChange={(e) => update("matterNumber", e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              placeholder="Case Number"
              value={form.caseNumber}
              onChange={(e) => update("caseNumber", e.target.value)}
              className="rounded-lg border p-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.matterType}
              onChange={(e) => update("matterType", e.target.value)}
              className="rounded-lg border p-3"
            >
              <option>Civil</option>
              <option>Criminal</option>
              <option>Family</option>
              <option>Consumer</option>
              <option>Labour</option>
              <option>Property</option>
            </select>

            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="rounded-lg border p-3"
            >
              <option>Active</option>
              <option>Pending</option>
              <option>Closed</option>
            </select>
          </div>

          <input
            placeholder="Court"
            value={form.court}
            onChange={(e) => update("court", e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <input
            placeholder="Judge Name"
            value={form.judgeName}
            onChange={(e) => update("judgeName", e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          {/* NEW SECTION */}

          <div className="rounded-xl border bg-slate-50 p-4">
            <h3 className="mb-3 font-semibold text-slate-800">
              Opposite Party (Recipient)
            </h3>

            <input
              placeholder="Opposite Party Name"
              value={form.oppositePartyName}
              onChange={(e) =>
                update("oppositePartyName", e.target.value)
              }
              className="mb-3 w-full rounded-lg border p-3"
            />

            <textarea
              rows={3}
              placeholder="Opposite Party Address"
              value={form.oppositePartyAddress}
              onChange={(e) =>
                update("oppositePartyAddress", e.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>
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
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Create Matter"}
          </button>
        </div>
      </div>
    </div>
  );
}