import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Scale,
  CalendarDays,
  FileText,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";
import { useEffect, useState } from "react";

const menuItems = [
  { to: "/", icon: LayoutDashboard, key: "dashboard" },
  { to: "/clients", icon: Users, key: "clients" },
  { to: "/matters", icon: Scale, key: "matters" },
  { to: "/hearings", icon: CalendarDays, key: "hearings" },
  { to: "/documents", icon: FileText, key: "documents" },
  { to: "/ai-drafts", icon: Sparkles, key: "aiDrafts" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [, setLang] = useState(i18n.language);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);

    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  const displayName = user?.email
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : "Advocate";

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-wide">DraftLex</h1>
        <p className="mt-1 text-sm text-slate-400">
          {i18n.language.startsWith("hi")
            ? "विधिक प्रबंधन"
            : "Legal Management"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                <span>{i18n.t(item.key)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom Profile */}
      <div className="border-t border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold">
            {displayName.charAt(0)}
          </div>

          <div>
            <div className="font-semibold">{displayName}</div>
            <div className="text-xs text-slate-400">
              {i18n.language.startsWith("hi") ? "अधिवक्ता" : "Advocate"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}