import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  User,
  Scale,
  CalendarDays,
  FileText,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import i18n from "../i18n";
import { legalText } from "../utils/legalTranslations";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Result {
  id: string;
  title: string;
  subtitle: string;
  type: "client" | "matter" | "hearing" | "document";
}

export default function GlobalSearch({ open, onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [recentActivity, setRecentActivity] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setResults([]);
    setSelected(0);

    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Load Recent Activity
  useEffect(() => {
    if (!open) return;

    const loadRecent = async () => {
      try {
        const { data } = await api.get("/Matters/recent-activity");

        const recent: Result[] = (data || []).map((item: any) => ({
          id: item.matterId,
          title: legalText(item.matterTitle),
          subtitle: legalText(item.title),
          type:
            item.type === "MatterCreated"
              ? "matter"
              : item.type === "HearingScheduled"
                ? "hearing"
                : item.type === "DocumentUploaded"
                  ? "document"
                  : "matter",
        }));

        setRecentActivity(recent.slice(0, 5));
      } catch (err) {
        console.error("Failed to load recent activity", err);
      }
    };

    loadRecent();
  }, [open]);

  // Search
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        const [clients, matters, hearings, documents] = await Promise.all([
          api.get("/Clients"),
          api.get("/Matters"),
          api.get("/Hearings"),
          api.get("/Documents"),
        ]);

        const q = query.toLowerCase();

        const data: Result[] = [
          ...(clients.data || [])
            .filter((c: any) => c.fullName?.toLowerCase().includes(q))
            .map((c: any) => ({
              id: c.id,
              title: c.fullName,
              subtitle: i18n.language.startsWith("hi")
                ? "ग्राहक"
                : "Client",
              type: "client",
            })),

          ...(matters.data || [])
            .filter(
              (m: any) =>
                m.title?.toLowerCase().includes(q) ||
                m.matterNumber?.toLowerCase().includes(q)
            )
            .map((m: any) => ({
              id: m.id,
              title: m.title,
              subtitle: m.matterNumber,
              type: "matter",
            })),

          ...(hearings.data || [])
            .filter(
              (h: any) =>
                h.matterTitle?.toLowerCase().includes(q) ||
                h.stage?.toLowerCase().includes(q)
            )
            .map((h: any) => ({
              id: h.matterId,
              title: h.matterTitle,
              subtitle: legalText(h.stage),
              type: "hearing",
            })),

          ...(documents.data || [])
            .filter((d: any) => d.title?.toLowerCase().includes(q))
            .map((d: any) => ({
              id: d.id,
              title: d.title,
              subtitle: legalText(d.documentType),
              type: "document",
            })),
        ];

        setResults(data.slice(0, 12));
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  const active = useMemo(() => results[selected], [results, selected]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }

      if (e.key === "Enter" && active) {
        openResult(active);
      }

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [results, active, open]);

  function openResult(item: Result) {
    onClose();

    switch (item.type) {
      case "client":
        navigate(`/clients/${item.id}`);
        break;

      case "matter":
      case "hearing":
        navigate(`/matters/${item.id}`);
        break;

      case "document":
        navigate(`/documents/${item.id}`);
        break;
    }
  }

  function icon(type: Result["type"]) {
    switch (type) {
      case "client":
        return (
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <User size={18} />
          </div>
        );

      case "matter":
        return (
          <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
            <Scale size={18} />
          </div>
        );

      case "hearing":
        return (
          <div className="rounded-lg bg-green-100 p-2 text-green-600">
            <CalendarDays size={18} />
          </div>
        );

      default:
        return (
          <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
            <FileText size={18} />
          </div>
        );
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/45 backdrop-blur-lg p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_35px_80px_rgba(15,23,42,.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <Search className="text-slate-400" size={20} />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              i18n.language.startsWith("hi")
                ? "ग्राहक, मामले, सुनवाई खोजें..."
                : "Search clients, matters, hearings..."
            }
            className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
          />

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          {!query ? (
            <div className="p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Activity
              </div>

              <div className="space-y-1">
                {recentActivity.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    No recent activity
                  </div>
                ) : (
                  recentActivity.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => openResult(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-100"
                    >
                      {icon(item.type)}

                      <div className="flex-1 text-left">
                        <div className="font-medium text-slate-800">
                          {legalText(item.title)}
                        </div>

                        <div className="text-sm text-slate-500">
                          {legalText(item.subtitle)}
                        </div>
                      </div>

                      <span className="text-xs capitalize text-slate-400">
                        {item.type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-2">
              {results.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  No results found
                </div>
              ) : (
                results.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => openResult(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      index === selected
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {icon(item.type)}

                    <div className="flex-1">
                      <div className="font-medium text-slate-800">
                        {legalText(item.title)}
                      </div>

                      <div className="text-sm text-slate-500">
                        {legalText(item.subtitle)}
                      </div>
                    </div>

                    <span className="text-xs capitalize text-slate-400">
                      {item.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          <span>↑↓ Navigate · Enter Open</span>
          <span>Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}