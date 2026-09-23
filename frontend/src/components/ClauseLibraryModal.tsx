import { useEffect, useMemo, useState } from "react";
import { X, Search, BookOpen } from "lucide-react";
import api from "../api/client";

interface Clause {
  id: string;
  title: string;
  category: string;
  content: string;
  isSystemClause: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

const categories = [
  "All",
  "Legal Notice",
  "Property",
  "Employment",
  "Consumer",
  "Defamation",
];

export default function ClauseLibraryModal({
  open,
  onClose,
  onInsert,
}: Props) {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    loadClauses();
  }, [open]);

  const loadClauses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/LegalClauses");
      setClauses(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load clauses.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return clauses.filter((c) => {
      const matchCategory =
        category === "All" || c.category === category;

      const term = search.toLowerCase();

      const matchSearch =
        c.title.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term) ||
        c.content.toLowerCase().includes(term);

      return matchCategory && matchSearch;
    });
  }, [clauses, search, category]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">Clause Library</h2>
            <p className="text-sm text-slate-500">
              Insert ready-made legal clauses into your draft.
            </p>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="border-b p-4">
          <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clauses..."
              className="w-full outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm ${
                  category === c
                    ? "bg-blue-600 text-white"
                    : "border hover:bg-slate-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center text-slate-500">
              Loading clauses...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-500">
              No clauses found.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((clause) => (
                <div
                  key={clause.id}
                  className="rounded-xl border p-5 hover:border-blue-300 hover:bg-slate-50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600" />
                        <h3 className="font-semibold">{clause.title}</h3>
                      </div>

                      <p className="text-sm text-slate-500">
                        {clause.category}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onInsert(clause.content);
                        onClose();
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Insert
                    </button>
                  </div>

                  <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}