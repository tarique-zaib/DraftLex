import { useEffect, useMemo, useRef, useState } from "react";
import { Search, User, Scale, CalendarDays, FileText, X } from "lucide-react";
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
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
            .filter((c: any) =>
              c.fullName?.toLowerCase().includes(q)
            )
            .map((c: any) => ({
              id: c.id,
              title: c.fullName,
              subtitle: i18n.language.startsWith("hi")
                ? "ग्राहक"
                : "Client",
              type: "client",
            })),

          ...(matters.data || [])
            .filter((m: any) =>
              m.title?.toLowerCase().includes(q)
            )
            .map((m: any) => ({
              id: m.id,
              title: m.title,
              subtitle: m.matterNumber,
              type: "matter",
            })),

          ...(hearings.data || [])
            .filter((h: any) =>
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
            .filter((d: any) =>
              d.title?.toLowerCase().includes(q)
            )
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
    }, 250);

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
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [results, active]);

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
        return <User size={18} />;

      case "matter":
        return <Scale size={18} />;

      case "hearing":
        return <CalendarDays size={18} />;

      default:
        return <FileText size={18} />;
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm">
      <div className="mx-auto mt-20 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center gap-3 border-b p-4">
          <Search className="text-slate-400" size={20} />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              i18n.language.startsWith("hi")
                ? "ग्राहक, मामला, दस्तावेज़ खोजें..."
                : "Search clients, matters, documents..."
            }
            className="flex-1 bg-transparent outline-none"
          />

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}

        <div className="max-h-[420px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {query
                ? i18n.language.startsWith("hi")
                  ? "कोई परिणाम नहीं मिला"
                  : "No results found."
                : i18n.language.startsWith("hi")
                  ? "खोज शुरू करें"
                  : "Start typing to search"}
            </div>
          ) : (
            results.map((item, index) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => openResult(item)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  index === selected
                    ? "bg-blue-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="rounded-lg bg-slate-100 p-2">
                  {icon(item.type)}
                </div>

                <div className="flex-1">
                  <div className="font-medium">
                    {legalText(item.title)}
                  </div>

                  <div className="text-sm text-slate-500">
                    {legalText(item.subtitle)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}

        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-slate-500">
          <div>↑ ↓ Navigate • Enter Open</div>

          <div>Esc Close</div>
        </div>
      </div>
    </div>
  );
}