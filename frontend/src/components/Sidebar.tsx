import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Scale,
  CalendarDays,
  FileText,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Clients", icon: Users, to: "/clients" },
  { label: "Matters", icon: Scale, to: "/matters" },
  { label: "Hearings", icon: CalendarDays, to: "/hearings" },
  { label: "Documents", icon: FileText, to: "/documents" },
  { label: "AI Drafts", icon: Sparkles, to: "/ai-drafts" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-blue-400">DraftLex</h1>
        <p className="mt-1 text-sm text-slate-400">Advocate Workspace</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        {/* <div className="mb-4">
          <p className="text-sm font-semibold">
            {user?.email.split("@")[0]}
          </p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </div> */}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-300 transition hover:bg-red-900/30 hover:text-red-200"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}