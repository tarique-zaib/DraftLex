import { useState, useEffect } from "react";
import {
  Bot,
  Send,
  Loader2,
  SquarePen,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import i18n from "../i18n";

interface Props {
  matterId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  openInEditor?: boolean;
}

interface CopilotDocument {
  id: string;
  title: string;
  documentType: string;
  version: number;
  status: string;
}

const suggestions = [
  "Summarize this case.",
  "Prepare arguments for the next hearing.",
  "Draft an affidavit.",
  "Draft a written statement.",
  "List pending tasks.",
  "Find missing documents.",
];

export default function CopilotPanel({ matterId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Document context
  const [documents, setDocuments] = useState<CopilotDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(
    [],
  );
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const navigate = useNavigate();

  // ------------------------------------------------------------
  // Load Copilot history
  // ------------------------------------------------------------

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get(`/copilot/history/${matterId}`);

        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
        } else {
          setMessages([
            {
              role: "assistant",
              content: i18n.language.startsWith("hi")
                ? "नमस्ते! मैं DraftLex Copilot हूँ। मैं इस मामले को समझने में आपकी सहायता कर सकता हूँ।"
                : "Hello! I'm DraftLex Copilot. I can help you understand this matter.",
            },
          ]);
        }
      } catch (err) {
        console.error(err);

        setMessages([
          {
            role: "assistant",
            content: i18n.language.startsWith("hi")
              ? "नमस्ते! मैं DraftLex Copilot हूँ।"
              : "Hello! I'm DraftLex Copilot.",
          },
        ]);
      }
    };

    loadHistory();
  }, [matterId]);

  // ------------------------------------------------------------
  // Load Matter documents
  // ------------------------------------------------------------

  useEffect(() => {
    const loadDocuments = async () => {
      if (!matterId) return;

      try {
        setDocumentsLoading(true);

        const { data } = await api.get(
          `/Documents/matter/${matterId}`,
        );

        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.error("Failed to load Copilot documents", err);
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    loadDocuments();
  }, [matterId]);

  // ------------------------------------------------------------
  // Toggle document selection
  // ------------------------------------------------------------

  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId],
    );
  };

  // ------------------------------------------------------------
  // Case Summary
  // ------------------------------------------------------------

  const summarizeCase = async () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: i18n.language.startsWith("hi")
          ? "इस मामले का सारांश बताइए।"
          : "Summarize this case.",
      },
    ]);

    setLoading(true);

    try {
      const { data } = await api.get(
        `/AI/case-summary/${matterId}`,
      );

      const reply =
        `${data.summary}\n\n` +
        `${
          i18n.language.startsWith("hi")
            ? "मुख्य तथ्य:"
            : "Key Facts:"
        }\n` +
        data.keyFacts.map((f: string) => `• ${f}`).join("\n") +
        `\n\n${
          i18n.language.startsWith("hi")
            ? "जोखिम स्तर"
            : "Risk Level"
        }: ${data.riskLevel}` +
        `\n${
          i18n.language.startsWith("hi")
            ? "अगला कदम"
            : "Next Action"
        }: ${data.nextAction}` +
        (data.nextHearing
          ? `\n${
              i18n.language.startsWith("hi")
                ? "अगली सुनवाई"
                : "Next Hearing"
            }: ${new Date(
              data.nextHearing,
            ).toLocaleDateString(
              i18n.language.startsWith("hi")
                ? "hi-IN"
                : "en-IN",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            )}`
          : "");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          openInEditor: true,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: i18n.language.startsWith("hi")
            ? "मामले का सारांश तैयार नहीं किया जा सका।"
            : "Unable to generate the case summary.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Arguments
  // ------------------------------------------------------------

  const generateArguments = async () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: i18n.language.startsWith("hi")
          ? "अगली सुनवाई के लिए तर्क तैयार करें।"
          : "Prepare arguments for the next hearing.",
      },
    ]);

    setLoading(true);

    try {
      const { data } = await api.get(
        `/AI/arguments/${matterId}`,
      );

      const reply =
        `## ${data.title}\n\n` +
        `${data.introduction}\n\n` +
        data.arguments.map((a: string) => `• ${a}`).join("\n") +
        `\n\n**${
          i18n.language.startsWith("hi")
            ? "निष्कर्ष"
            : "Conclusion"
        }:**\n${data.conclusion}` +
        (data.nextHearing
          ? `\n\n**${
              i18n.language.startsWith("hi")
                ? "अगली सुनवाई"
                : "Next Hearing"
            }:** ${new Date(
              data.nextHearing,
            ).toLocaleDateString(
              i18n.language.startsWith("hi")
                ? "hi-IN"
                : "en-IN",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            )}`
          : "");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          openInEditor: true,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: i18n.language.startsWith("hi")
            ? "तर्क तैयार नहीं किए जा सके।"
            : "Unable to generate arguments.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Affidavit
  // ------------------------------------------------------------

  const generateAffidavit = async () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: i18n.language.startsWith("hi")
          ? "शपथपत्र तैयार करें।"
          : "Draft an affidavit.",
      },
    ]);

    setLoading(true);

    try {
      const { data } = await api.get(
        `/AI/affidavit/${matterId}`,
      );

      const reply =
        `# ${data.title}\n\n` +
        `**${
          i18n.language.startsWith("hi")
            ? "न्यायालय"
            : "Court"
        }:** ${data.court}\n` +
        `**${
          i18n.language.startsWith("hi")
            ? "मामला"
            : "Matter"
        }:** ${data.matterTitle}\n` +
        `**${
          i18n.language.startsWith("hi")
            ? "शपथकर्ता"
            : "Affiant"
        }:** ${data.affiantName}\n\n` +
        `${data.body}\n\n` +
        `${data.verification}`;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          openInEditor: true,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: i18n.language.startsWith("hi")
            ? "शपथपत्र तैयार नहीं किया जा सका।"
            : "Unable to generate affidavit.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Open generated content in editor
  // ------------------------------------------------------------

  const openInEditor = (content: string) => {
    navigate(`/ai-drafts?matterId=${matterId}`, {
      state: {
        aiContent: content,
        source: "copilot",
      },
    });
  };

  // ------------------------------------------------------------
  // Send message
  // ------------------------------------------------------------

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();

    if (!message || loading) return;

    // Existing AI Summary endpoint
    if (message === "Summarize this case.") {
      setInput("");
      await summarizeCase();
      return;
    }

    // Existing Arguments endpoint
    if (message === "Prepare arguments for the next hearing.") {
      setInput("");
      await generateArguments();
      return;
    }

    // Existing Affidavit endpoint
    if (message === "Draft an affidavit.") {
      setInput("");
      await generateAffidavit();
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post(
        "/copilot/chat",
        {
          matterId,
          message,
          documentIds: selectedDocumentIds,
        },
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: i18n.language.startsWith("hi")
            ? "क्षमा करें, मैं आपका अनुरोध पूरा नहीं कर सका।"
            : "Sorry, I couldn't process your request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white shadow-sm">

      {/* Header */}

      <div className="flex items-center gap-2 border-b p-4">
        <Bot
          className="text-blue-600"
          size={22}
        />

        <div>
          <h3 className="font-semibold">
            DraftLex Copilot
          </h3>

          <p className="text-xs text-slate-500">
            {i18n.language.startsWith("hi")
              ? "मामले का एआई सहायक"
              : "Matter-aware AI Assistant"}
          </p>
        </div>
      </div>

      {/* Document Context */}

      <div className="border-b bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <FileText
            size={16}
            className="text-blue-600"
          />

          <span className="text-sm font-semibold text-slate-700">
            {i18n.language.startsWith("hi")
              ? "दस्तावेज़ संदर्भ"
              : "Document Context"}
          </span>

          <span className="text-xs text-slate-500">
            ({selectedDocumentIds.length} selected)
          </span>
        </div>

        {documentsLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2
              size={14}
              className="animate-spin"
            />

            {i18n.language.startsWith("hi")
              ? "दस्तावेज़ लोड हो रहे हैं..."
              : "Loading documents..."}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-xs text-slate-500">
            {i18n.language.startsWith("hi")
              ? "इस मामले में कोई दस्तावेज़ नहीं मिला।"
              : "No documents found for this matter."}
          </div>
        ) : (
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {documents.map((document) => (
              <label
                key={document.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedDocumentIds.includes(
                    document.id,
                  )}
                  onChange={() =>
                    toggleDocument(document.id)
                  }
                  disabled={loading}
                  className="h-4 w-4"
                />

                <FileText
                  size={16}
                  className="shrink-0 text-slate-500"
                />

                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {document.title}
                </span>

                <span className="shrink-0 text-xs text-slate-400">
                  v{document.version}
                </span>
              </label>
            ))}
          </div>
        )}

        {selectedDocumentIds.length === 0 &&
          documents.length > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              {i18n.language.startsWith("hi")
                ? "दस्तावेज़-आधारित उत्तर के लिए दस्तावेज़ चुनें।"
                : "Select documents when you want Copilot to use their contents."}
            </p>
          )}
      </div>

      {/* Suggestions */}

      <div className="border-b p-3">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="rounded-full border px-3 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i}>
            <div
              className={`max-w-[90%] whitespace-pre-wrap rounded-xl p-3 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </div>

            {m.role === "assistant" &&
              m.openInEditor && (
                <button
                  onClick={() =>
                    openInEditor(m.content)
                  }
                  className="mt-2 flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                >
                  <SquarePen size={16} />

                  {i18n.language.startsWith("hi")
                    ? "एडिटर में खोलें"
                    : "Open in Editor"}
                </button>
              )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm">
            <Loader2
              className="animate-spin"
              size={16}
            />

            {i18n.language.startsWith("hi")
              ? "DraftLex AI सोच रहा है..."
              : "DraftLex AI is thinking..."}
          </div>
        )}
      </div>

      {/* Input */}

      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              i18n.language.startsWith("hi")
                ? "Copilot से पूछें..."
                : "Ask Copilot..."
            }
            className="flex-1 resize-none rounded-lg border p-3 outline-none focus:border-blue-500"
          />

          <button
            onClick={() => sendMessage()}
            disabled={
              loading ||
              !input.trim()
            }
            className="rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {i18n.language.startsWith("hi")
            ? "Enter भेजने के लिए · Shift+Enter नई पंक्ति के लिए"
            : "Enter to send · Shift+Enter for newline"}
        </p>
      </div>
    </div>
  );
}