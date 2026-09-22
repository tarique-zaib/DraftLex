import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Save, CheckCircle, ArrowLeft } from "lucide-react";
import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import LegalEditor from "../components/LegalEditor";
import { marked } from "marked";

interface Document {
  id: string;
  title: string;
  documentType: string;
  content: string;
  version: number;
  status: string;
}

export default function DocumentViewer() {
  const { id } = useParams();

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const firstLoad = useRef(true);

  useEffect(() => {
    loadDocument();
  }, [id]);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveDocument();
    }, 3000);

    return () => clearTimeout(timer);
  }, [content]);

  const loadDocument = async () => {
    try {
      const { data } = await api.get<Document>(`/Documents/${id}`);

      setDocument(data);
      setContent(marked.parse(data.content) as string);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!document) return;

    try {
      setSaving(true);
      setSaved(false);

      await api.put(`/Documents/${document.id}`, {
        title: document.title,
        content,
        status: document.status,
      });

      setSaved(true);

      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        Loading document...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        Document not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => window.history.back()}
                className="mb-3 flex items-center gap-2 text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <h1 className="text-3xl font-bold text-slate-900">
                {document.title}
              </h1>

              <p className="mt-1 text-slate-500">
                {document.documentType} • Version {document.version}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {saving ? (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 text-yellow-700">
                  <Save size={18} />
                  Saving...
                </div>
              ) : saved ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-700">
                  <CheckCircle size={18} />
                  Saved
                </div>
              ) : (
                <button
                  onClick={saveDocument}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                >
                  <Save size={18} />
                  Save
                </button>
              )}

              <UserMenu />
            </div>
          </div>

          {/* Editor */}
          <LegalEditor content={content} onChange={setContent} />
        </main>
      </div>
    </div>
  );
}