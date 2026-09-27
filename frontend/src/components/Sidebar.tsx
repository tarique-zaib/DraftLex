import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Scale,
  CalendarDays,
  FileText,
  Sparkles,
  Menu,
  X,
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  const displayName = user?.email
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : "Advocate";

  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              DraftLex
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {i18n.language.startsWith("hi")
                ? "विधिक प्रबंधन"
                : "Legal Management"}
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-800 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>
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
                onClick={() => setOpen(false)}
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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
            {displayName.charAt(0)}
          </div>

          <div>
            <div className="font-semibold text-white">{displayName}</div>
            <div className="text-xs text-slate-400">
              {i18n.language.startsWith("hi") ? "अधिवक्ता" : "Advocate"}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
      @media (max-width: 1023px) {

        /* Push EVERY page below the hamburger */
        aside + main {
          padding-top: 6rem !important;
          min-width: 0;
          flex: 1;
        }

        /* Prevent horizontal overflow */
        main {
          overflow-x: hidden;
        }

        /* Make header actions wrap instead of overflowing */
        main > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        main > div:first-child > div:last-child {
          display: flex;
          flex-wrap: wrap;
          gap: .75rem;
          width: 100%;
        }

        main > div:first-child > div:last-child > button:first-child {
          width: 100%;
        }
      }
    `}</style>
      {/* MOBILE HAMBURGER */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-[9999] rounded-xl bg-slate-900 p-3 text-white shadow-xl lg:hidden"
      >
        <Menu size={24} />
      </button>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:bg-slate-900 lg:text-white lg:sticky lg:top-0">
        {SidebarContent}
      </aside>

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed left-0 top-0 z-[9999] flex h-full w-64 flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarContent}
      </aside>
    </>
  );
}
