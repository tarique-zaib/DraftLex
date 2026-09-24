import { useEffect, useState } from "react";
import { CalendarDays, FileText } from "lucide-react";
import api from "../api/client";
import AppModal from "./AppModal";
import i18n from "../i18n";

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
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    hearingDate: "",
    remarks: "",
  });

  // Load hearing whenever modal opens
  useEffect(() => {
    if (!open || !hearingId) return;

    loadHearing();
  }, [open, hearingId]);

  const loadHearing = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/Hearings/${hearingId}`);

      // UTC -> local datetime-local format
      const utc = new Date(data.hearingDate);
      const local = new Date(
        utc.getTime() - utc.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);

      setForm({
        hearingDate: local,
        remarks: data.remarks ?? "",
      });
    } catch (err) {
      console.error(err);

      alert(
        i18n.language.startsWith("hi")
          ? "सुनवाई लोड नहीं हो सकी।"
          : "Unable to load hearing."
      );
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!hearingId || !form.hearingDate) {
      alert(
        i18n.language.startsWith("hi")
          ? "नई सुनवाई की तारीख आवश्यक है।"
          : "New hearing date is required."
      );
      return;
    }

    try {
      setLoading(true);

      await api.put(`/Hearings/${hearingId}/reschedule`, {
        hearingDate: new Date(form.hearingDate).toISOString(),
        remarks: form.remarks,
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);

      alert(
        i18n.language.startsWith("hi")
          ? "सुनवाई पुनर्निर्धारित नहीं हो सकी।"
          : "Unable to reschedule hearing."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={
        i18n.language.startsWith("hi")
          ? "सुनवाई पुनर्निर्धारित करें"
          : "Reschedule Hearing"
      }
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-5 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            {i18n.language.startsWith("hi") ? "रद्द करें" : "Cancel"}
          </button>

          <button
            onClick={save}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? i18n.language.startsWith("hi")
                ? "सहेजा जा रहा है..."
                : "Saving..."
              : i18n.language.startsWith("hi")
                ? "पुनर्निर्धारित करें"
                : "Reschedule"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            {i18n.language.startsWith("hi")
              ? "नई सुनवाई की तिथि एवं समय"
              : "New Hearing Date & Time"}
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="datetime-local"
              value={form.hearingDate}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  hearingDate: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            {i18n.language.startsWith("hi")
              ? "पुनर्निर्धारण का कारण"
              : "Reason for Rescheduling"}
          </label>

          <div className="relative">
            <FileText
              size={18}
              className="absolute left-3 top-4 text-slate-400"
            />

            <textarea
              rows={5}
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  remarks: e.target.value,
                }))
              }
              placeholder={
                i18n.language.startsWith("hi")
                  ? "पुनर्निर्धारण का कारण लिखें..."
                  : "Enter the reason for rescheduling..."
              }
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            {i18n.language.startsWith("hi")
              ? "नई तारीख टाइमलाइन और आगामी सुनवाई सूची में दिखाई जाएगी।"
              : "The new hearing date will appear in the Timeline and Upcoming Hearings."}
          </p>
        </div>
      </div>
    </AppModal>
  );
}