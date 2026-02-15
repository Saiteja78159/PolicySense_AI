import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { FileText, MessageSquare, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-slate-800">Policy & Compliance Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <nav className="bg-white border-b border-slate-200 px-4 flex gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-800'
            }`
          }
        >
          <MessageSquare size={18} /> Ask
        </NavLink>
        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-800'
            }`
          }
        >
          <FileText size={18} /> Documents
        </NavLink>
      </nav>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
