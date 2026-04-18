import { NavLink, useNavigate } from 'react-router-dom';
import {
  Inbox, MessageSquare, Users, Settings,
  UserCog, LogOut, Search, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/services';
import { Avatar } from '../components/ui/Avatar';
import { fullName } from '../utils/utils';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-slate-700/80 text-slate-100 font-medium'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
  }`;

export function Sidebar() {
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    logout();
    navigate('/login');
  };

  const isAdminOrSup = user?.role === 'admin' || user?.role === 'supervisor';
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-65 shrink-0 h-screen bg-slate-900 border-r border-slate-800 flex flex-col select-none">
      {/* Workspace header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <MessageSquare size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-100 truncate">Social Inbox</span>
      </div>

      {/* Search bar */}
      <NavLink
        to="/search"
        className={({ isActive }) =>
          `mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-slate-700/80 text-slate-100' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Search size={14} />
        <span>Search…</span>
      </NavLink>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <NavLink to="/inbox" className={navLink}>
          <Inbox size={16} />
          My Inbox
        </NavLink>

        {/* Conversations section */}
        <div className="pt-3 pb-1">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Conversations
          </span>
        </div>
        <NavLink to="/conversations" end className={navLink}>
          <MessageSquare size={16} />
          All Conversations
        </NavLink>

        {/* Clients */}
        {isAdminOrSup && (
          <>
            <div className="pt-3 pb-1">
              <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Contacts
              </span>
            </div>
            <NavLink to="/clients" className={navLink}>
              <Users size={16} />
              Clients
            </NavLink>
          </>
        )}

        {/* Settings section */}
        <div className="pt-3 pb-1">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-500"
          >
            <span>Settings</span>
            <ChevronDown size={10} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {settingsOpen && (
          <>
            {isAdmin && (
              <NavLink to="/settings/users" className={navLink}>
                <UserCog size={16} />
                Users
              </NavLink>
            )}
            {isAdminOrSup && (
              <NavLink to="/settings/agents" className={navLink}>
                <Users size={16} />
                Agents
              </NavLink>
            )}
            <NavLink to="/settings/profile" className={navLink}>
              <Settings size={16} />
              Profile
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-slate-800 px-3 py-3 flex items-center gap-2">
          <Avatar name={fullName(user)} size="sm" status={user.status} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{fullName(user)}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}

