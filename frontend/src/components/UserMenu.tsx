import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <User size={18} />
        </div>

        <div className="hidden text-left md:block">
          <div className="text-sm font-semibold text-slate-900">
            {user.email.split("@")[0]}
          </div>
          <div className="text-xs text-slate-500">{user.role}</div>
        </div>

        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-4">
            <div className="font-semibold text-slate-900">
              {user.email.split("@")[0]}
            </div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              {user.role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-b-2xl px-4 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}