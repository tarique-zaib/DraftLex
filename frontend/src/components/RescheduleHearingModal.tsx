import { useState, useEffect } from "react";
import api from "../api/client";
import AppModal from "./AppModal";

interface Props {
  open: boolean;
  hearingId: string | null;
  currentDate: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function RescheduleHearingModal({
  open,
  hearingId,
  currentDate,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [hearingDate, setHearingDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) return;

    setHearingDate(currentDate?.slice(0, 16) || "");
    setRemarks("");
  }, [open, currentDate]);

  const save = async () => {
    if (!hearingId) return;

    try {
      setLoading(true);

      await api.put(`/Hearings/${hearingId}/reschedule`, {
        hearingDate,
        remarks,
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Unable to reschedule hearing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      title="Reschedule Hearing"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            New Hearing Date & Time
          </label>

          <input
            type="datetime-local"
            value={hearingDate}
            onChange={(e) => setHearingDate(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Remarks
          </label>

          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Reason for rescheduling"
            className="w-full rounded-lg border p-3"
          />
        </div>
      </div>
    </AppModal>
  );
}