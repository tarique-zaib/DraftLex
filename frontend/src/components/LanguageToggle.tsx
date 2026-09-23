import { useEffect, useState } from "react";
import i18n from "../i18n";

export default function LanguageToggle() {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-3 py-2 text-sm ${
          lang.startsWith("en")
            ? "bg-blue-600 text-white"
            : "text-slate-600"
        }`}
      >
        EN
      </button>

      <button
        onClick={() => i18n.changeLanguage("hi")}
        className={`px-3 py-2 text-sm ${
          lang.startsWith("hi")
            ? "bg-blue-600 text-white"
            : "text-slate-600"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}