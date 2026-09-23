import { useEffect, useState } from "react";
import api from "../api/client";
import AppModal from "./AppModal";

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
    <AppModal
      open={open}
      title="Schedule Hearing"
      onClose={onClose}
      maxWidth="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Schedule Hearing"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <select
          value={form.matterId}
          onChange={(e) => update("matterId", e.target.value)}
          className="w-full rounded-lg border p-3"
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
          className="w-full rounded-lg border p-3"
        />

        <select
          value={form.stage}
          onChange={(e) => update("stage", e.target.value)}
          className="w-full rounded-lg border p-3"
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
          className="w-full rounded-lg border p-3"
        />

        <input
          placeholder="Court Room"
          value={form.courtRoom}
          onChange={(e) => update("courtRoom", e.target.value)}
          className="w-full rounded-lg border p-3"
        />

        <textarea
          placeholder="Remarks"
          rows={3}
          value={form.remarks}
          onChange={(e) => update("remarks", e.target.value)}
          className="w-full rounded-lg border p-3"
        />
      </div>
    </AppModal>
  );
}