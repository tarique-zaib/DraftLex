import { useState, useEffect } from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import api from "../api/client";

interface Props {
  matterId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get(`/copilot/history/${matterId}`);

        if (data.length === 0) {
          setMessages([
            {
              role: "assistant",
              content:
                "Hello! I'm DraftLex Copilot. I already know this matter.",
            },
          ]);
          return;
        }

        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadHistory();
  }, [matterId]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();

    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/copilot/chat", {
        matterId,
        message,
      });

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
          content: "Sorry, I couldn't process your request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b p-4">
        <Bot className="text-blue-600" size={22} />
        <div>
          <h3 className="font-semibold">DraftLex Copilot</h3>
          <p className="text-xs text-slate-500">Matter-aware AI Assistant</p>
        </div>
      </div>

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

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-xl p-3 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm">
            <Loader2 className="animate-spin" size={16} />
            DraftLex AI is thinking...
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask Copilot..."
            className="flex-1 resize-none rounded-lg border p-3 outline-none focus:border-blue-500"
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
