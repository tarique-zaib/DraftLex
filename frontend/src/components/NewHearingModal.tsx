import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../api/client";

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

export default function NewHearingModal({ open, onClose, onCreated }: Props) {
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

  if (!open) return null;

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.matterId || !form.hearingDate) {
      alert("Matter and Hearing Date are required.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/Hearings", form);

      onCreated();
      onClose();

      setForm({
        matterId: "",
        hearingDate: "",
        stage: "First Hearing",
        judgeName: "",
        courtRoom: "",
        remarks: "",
      });
    } catch (e) {
      console.error(e);
      alert("Unable to schedule hearing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
        <div className="flex justify-between items-center border-b p-5">
          <h2 className="text-xl font-semibold">Schedule Hearing</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <select
            value={form.matterId}
            onChange={(e) => update("matterId", e.target.value)}
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Matter</option>

            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.matterNumber} • {m.title}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={form.hearingDate}
            onChange={(e) => update("hearingDate", e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <select
            value={form.stage}
            onChange={(e) => update("stage", e.target.value)}
            className="w-full border rounded-lg p-3"
          >
            <option>First Hearing</option>
            <option>Evidence</option>
            <option>Arguments</option>
            <option>Cross Examination</option>
            <option>Final Order</option>
          </select>

          <input
            placeholder="Judge Name"
            value={form.judgeName}
            onChange={(e) => update("judgeName", e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            placeholder="Court Room"
            value={form.courtRoom}
            onChange={(e) => update("courtRoom", e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <textarea
            placeholder="Remarks"
            rows={3}
            value={form.remarks}
            onChange={(e) => update("remarks", e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="border rounded-lg px-5 py-2">
            Cancel
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-5 py-2 hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Schedule Hearing"}
          </button>
        </div>
      </div>
    </div>
  );
}
