import i18n from "../i18n";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Scale, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();

  const [email, setEmail] = useState("tarique@draftlex.com");
  const [password, setPassword] = useState("DraftLex@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [, setLang] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex justify-end p-4 pb-0">
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => i18n.changeLanguage("en")}
              className={`px-4 py-2 text-sm font-medium transition ${
                i18n.language.startsWith("en")
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              EN
            </button>

            <button
              type="button"
              onClick={() => i18n.changeLanguage("hi")}
              className={`px-4 py-2 text-sm font-medium transition ${
                i18n.language.startsWith("hi")
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Scale size={32} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">DraftLex</h1>

          <p className="mt-2 text-slate-500">
            {i18n.language.startsWith("hi") ? "एआई आधारित विधिक प्रबंधन" :
            "AI-powered Legal Practice Management"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {i18n.language.startsWith("hi") ? "ईमेल" : "Email"}
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 px-3">
              <Mail className="text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-3 py-3 outline-none"
                placeholder={
                  i18n.language.startsWith("hi")
                    ? "अपना ईमेल दर्ज करें"
                    : "Enter your email"
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {i18n.language.startsWith("hi") ? "पासवर्ड" : "Password"}
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 px-3">
              <Lock className="text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-3 py-3 outline-none"
                placeholder={
                  i18n.language.startsWith("hi")
                    ? "अपना पासवर्ड दर्ज करें"
                    : "Enter your password"
                }
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? i18n.language.startsWith("hi")
                ? "साइन इन हो रहा है..."
                : "Signing In..."
              : i18n.language.startsWith("hi")
                ? "साइन इन करें"
                : "Sign In"}
          </button>
        </form>

        <div className="mt-8 border-t pt-6 text-center text-sm text-slate-500">
          {i18n.language.startsWith("hi")
            ? "DraftLex v1.0 • सुरक्षित अधिवक्ता पोर्टल"
            : "DraftLex v1.0 • Secure Advocate Portal"}
        </div>
      </div>
    </div>
  );
}
