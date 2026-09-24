import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [, setLang] = useState(i18n.language);

  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.email
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : "Advocate";

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);

    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {displayName.charAt(0)}
        </div>

        <div className="text-left">
          <p className="font-semibold text-slate-900">{displayName}</p>
          <p className="text-sm text-slate-500">
            {i18n.language.startsWith("hi") ? "अधिवक्ता" : "Advocate"}
          </p>
        </div>

        <ChevronDown
          size={18}
          className={`text-slate-500 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="p-5">
            <h3 className="text-xl font-semibold text-slate-900">
              {displayName}
            </h3>

            <p className="mt-1 text-slate-500">{user?.email}</p>

            <span className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {i18n.language.startsWith("hi") ? "अधिवक्ता" : "Advocate"}
            </span>
          </div>

          <div className="border-t">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-red-600 hover:bg-red-50"
            >
              <LogOut size={20} />
              {i18n.language.startsWith("hi")
                ? "साइन आउट"
                : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}