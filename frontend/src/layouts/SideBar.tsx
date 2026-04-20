import { NavLink, useNavigate } from 'react-router-dom';
import {
  Inbox, MessageSquare, Users, Settings,
  UserCog, Search, ChevronDown, Sun, Moon, Monitor, LogOut, Palette,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/services';
import { Avatar } from '../components/ui/Avatar';
import { fullName } from '../utils/utils';
import { useTheme, type ThemeMode } from '../hooks/useTheme';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-active text-1 font-medium'
      : 'text-2 hover:bg-active hover:text-1'
  }`;

const themeOptions: { value: ThemeMode; label: string; Icon: React.ElementType }[] = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export function Sidebar() {
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { mode, setMode } = useTheme();

  // Close popover when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  const handleLogout = async () => {
    setPopoverOpen(false);
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    logout();
    navigate('/login');
  };

  const isAdminOrSup = user?.role === 'admin' || user?.role === 'supervisor';
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <aside className="w-65 shrink-0 h-screen bg-sidebar border-r border-theme flex flex-col select-none">
        {/* Workspace header — shows user's full name */}
        <div className="px-4 py-3 border-b border-theme flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <MessageSquare size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-1 truncate">
            {user ? fullName(user) : 'DjezzyChat'}
          </span>
        </div>

        {/* Search bar */}
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-active text-1' : 'bg-search text-2 hover:text-1'
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

          <div className="pt-3 pb-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-3">
              Conversations
            </span>
          </div>
          <NavLink to="/conversations" end className={navLink}>
            <MessageSquare size={16} />
            All Conversations
          </NavLink>

          {isAdminOrSup && (
            <>
              <div className="pt-3 pb-1">
                <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-3">
                  Contacts
                </span>
              </div>
              <NavLink to="/clients" className={navLink}>
                <Users size={16} />
                Clients
              </NavLink>
            </>
          )}

          <div className="pt-3 pb-1">
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-widest text-3 hover:text-2"
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

        {/* User footer — clickable, opens popover */}
        {user && (
          <div className="relative border-t border-theme px-3 py-3" ref={popoverRef}>
            {/* Popover menu */}
            {popoverOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-popup border border-theme rounded-xl shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => { setPopoverOpen(false); setAppearanceOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-1 hover:bg-active transition-colors"
                >
                  <Palette size={15} className="text-brand" />
                  Appearance
                </button>
                <div className="border-t border-theme" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-active transition-colors"
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            )}

            {/* Clickable user row */}
            <button
              onClick={() => setPopoverOpen(o => !o)}
              className="w-full flex items-center gap-2 rounded-lg hover:bg-active px-1 py-1 transition-colors"
            >
              <Avatar name={fullName(user)} size="sm" status={user.status} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-1 truncate">{fullName(user)}</p>
                <p className="text-[10px] text-3 truncate">{user.email}</p>
              </div>
              <ChevronDown
                size={13}
                className={`text-3 transition-transform shrink-0 ${popoverOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        )}
      </aside>

      {/* Appearance modal */}
      {appearanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setAppearanceOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-popup border border-theme rounded-2xl shadow-2xl p-5 z-10">
            <h2 className="text-sm font-semibold text-1 mb-4">Appearance</h2>
            <div className="space-y-1">
              {themeOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => { setMode(value); setAppearanceOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                    mode === value
                      ? 'bg-brand-bg border border-brand text-brand font-medium'
                      : 'text-1 hover:bg-active border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {mode === value && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-brand" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}