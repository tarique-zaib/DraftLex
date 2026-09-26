import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Save, CheckCircle, ArrowLeft, FileText } from "lucide-react";
import { marked } from "marked";

import api from "../api/client";
import Sidebar from "../components/Sidebar";
import UserMenu from "../components/UserMenu";
import LegalEditor from "../components/LegalEditor";

interface Document {
  id: string;
  title: string;
  documentType: string;
  content: string;
  version: number;
  status: string;

  matterId: string;
  matterTitle: string;
  court: string;
  clientName: string;
}

export default function DocumentViewer() {
  const { id } = useParams();

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const firstLoad = useRef(true);

  const isEvidence = document?.documentType === "Evidence";

  const cleanFileName = document?.content?.replace(/<[^>]*>/g, "").trim();

  const evidenceUrl =
    document && isEvidence
      ? `${api.defaults.baseURL?.replace("/api", "")}/uploads/evidence/${cleanFileName}`
      : "";

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
      if (data.documentType === "Evidence") {
        setContent(data.content);
      } else {
        setContent(marked.parse(data.content) as string);
      }
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

              <button
                onClick={() => {
                  const apiBase =
                    api.defaults.baseURL?.replace(/\/$/, "") ||
                    `${window.location.origin}/api`;

                  window.open(`${apiBase}/Documents/${id}/pdf`, "_blank");
                }}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Export PDF
              </button>

              <UserMenu />
            </div>
          </div>

          {/* Editor */}
          {isEvidence ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              {cleanFileName?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={evidenceUrl}
                  title={document.title}
                  className="h-[800px] w-full rounded-lg border"
                />
              ) : /\.(jpg|jpeg|png)$/i.test(cleanFileName ?? "") ? (
                <img
                  src={evidenceUrl}
                  alt={document.title}
                  className="mx-auto max-h-[800px] rounded-lg border"
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                  <FileText size={48} className="mx-auto mb-3 text-blue-600" />
                  <p className="font-medium">{document.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    DOCX files cannot be previewed in the browser.
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <a
                  href={evidenceUrl}
                  download={document.title}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Download Evidence
                </a>
              </div>
            </div>
          ) : (
            <LegalEditor
              content={content}
              onChange={setContent}
              title={document.documentType}
              matterTitle={document.matterTitle}
              court={document.court}
              client={document.clientName}
            />
          )}
        </main>
      </div>
    </div>
  );
}
