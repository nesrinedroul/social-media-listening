import { NavLink, useNavigate } from 'react-router-dom';
import {
  Inbox, MessageSquare, Users, Settings,
  UserCog, LogOut, Search, ChevronDown,
  Sun, Moon, Monitor,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, type Theme } from '../store/authStore';
import { authApi } from '../api/services';
import { Avatar } from '../components/ui/Avatar';
import { fullName } from '../utils/utils';

/* ─── Appearance modal (centred overlay) ──────────────────────────────────── */
function AppearanceModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useAuthStore();

  const options: { value: Theme; label: string; Icon: React.ElementType }[] = [
    { value: 'light',  label: 'Light',  Icon: Sun     },
    { value: 'dark',   label: 'Dark',   Icon: Moon    },
    { value: 'system', label: 'System', Icon: Monitor },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        className="relative rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--popup)',
          border: '1px solid var(--border)',
          minWidth: 260,
          zIndex: 51,
        }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Appearance</p>
        </div>
        <div className="py-1">
          {options.map(({ value, label, Icon }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                onClick={() => { setTheme(value); onClose(); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors"
                style={{
                  color:      isActive ? 'var(--brand)' : 'var(--text-1)',
                  background: isActive ? 'var(--brand-bg)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--active)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--brand)' : 'var(--text-2)' }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── User footer popup ────────────────────────────────────────────────────── */
function UserFooter() {
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen]               = useState(false);
  const [showAppearance, setShowApp]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    if (refreshToken) { try { await authApi.logout(refreshToken); } catch { /* empty */ } }
    logout();
    navigate('/login');
  };

  const name = user ? fullName(user) : '';

  return (
    <>
      <div
        className="relative"
        style={{ borderTop: '1px solid var(--border)', padding: '12px' }}
        ref={ref}
      >
        {/* popup — appears above the footer */}
        {open && (
          <div
            className="absolute left-0 right-0 rounded-xl shadow-xl overflow-hidden"
            style={{
              bottom: 'calc(100% + 4px)',
              background: 'var(--popup)',
              border: '1px solid var(--border)',
              zIndex: 50,
            }}
          >
            <button
              onClick={() => { setOpen(false); setShowApp(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              style={{ color: 'var(--text-1)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--active)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <Sun size={14} style={{ color: 'var(--text-2)' }} />
              Appearance
            </button>
            <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--active)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <LogOut size={14} style={{ color: '#ef4444' }} />
              Log out
            </button>
          </div>
        )}

        {/* original footer layout — clickable row instead of separate logout icon */}
        {user && (
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center gap-2 rounded-lg transition-colors"
            style={{ padding: '4px 4px' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--active)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <Avatar name={name} size="sm" status={user.status} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-left" style={{ color: 'var(--text-1)' }}>
                {name}
              </p>
              <p className="text-[10px] truncate text-left" style={{ color: 'var(--text-3)' }}>
                {user.email}
              </p>
            </div>
            {/* chevron replaces logout icon — visual hint the row is clickable */}
            <ChevronDown
              size={13}
              style={{
                color: 'var(--text-3)',
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
                flexShrink: 0,
              }}
            />
          </button>
        )}
      </div>

      {showAppearance && <AppearanceModal onClose={() => setShowApp(false)} />}
    </>
  );
}

/* ─── nav link class helper — original logic, colors via CSS vars ─────────── */
const navLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'font-medium' : ''
  }`;

/* ─── Sidebar — original structure, only hardcoded slate colors swapped ────── */
export function Sidebar() {
  const { user } = useAuthStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isAdminOrSup = user?.role === 'admin' || user?.role === 'supervisor';
  const isAdmin      = user?.role === 'admin';

  return (
    <aside
      className="w-65 shrink-0 h-screen flex flex-col select-none"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* Workspace header — original layout, brand icon color changed */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          <MessageSquare size={14} color="#fff" />
        </div>
        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
          DjezzyChat
        </span>
      </div>

      {/* Search bar — original NavLink, bg changed from slate-800 → var(--search) */}
      <NavLink
        to="/search"
        className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        style={({ isActive }) => ({
          background: isActive ? 'var(--active)' : 'var(--search)',
          color: isActive ? 'var(--text-1)' : 'var(--text-2)',
          border: `1px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
        })}
      >
        <Search size={14} />
        <span>Search…</span>
      </NavLink>

      {/* Primary nav — original structure */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

        {/* My Inbox */}
        <NavLink
          to="/inbox"
          className={({ isActive }) => navLink({ isActive })}
          style={({ isActive }) => ({
            background: isActive ? 'var(--active)' : 'transparent',
            color: isActive ? 'var(--text-1)' : 'var(--text-2)',
          })}
        >
          <Inbox size={16} />
          My Inbox
        </NavLink>

        {/* Conversations section label */}
        <div className="pt-3 pb-1">
          <span
            className="px-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-3)' }}
          >
            Conversations
          </span>
        </div>
        <NavLink
          to="/conversations"
          end
          className={({ isActive }) => navLink({ isActive })}
          style={({ isActive }) => ({
            background: isActive ? 'var(--active)' : 'transparent',
            color: isActive ? 'var(--text-1)' : 'var(--text-2)',
          })}
        >
          <MessageSquare size={16} />
          All Conversations
        </NavLink>

        {/* Contacts section — admin/supervisor only */}
        {isAdminOrSup && (
          <>
            <div className="pt-3 pb-1">
              <span
                className="px-3 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}
              >
                Contacts
              </span>
            </div>
            <NavLink
              to="/clients"
              className={({ isActive }) => navLink({ isActive })}
              style={({ isActive }) => ({
                background: isActive ? 'var(--active)' : 'transparent',
                color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              })}
            >
              <Users size={16} />
              Clients
            </NavLink>
          </>
        )}

        {/* Settings section — collapsible, original behaviour */}
        <div className="pt-3 pb-1">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-widest transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
          >
            <span>Settings</span>
            <ChevronDown
              size={10}
              style={{ transition: 'transform 0.15s', transform: settingsOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>
        </div>

        {settingsOpen && (
          <>
            {isAdmin && (
              <NavLink
                to="/settings/users"
                className={({ isActive }) => navLink({ isActive })}
                style={({ isActive }) => ({
                  background: isActive ? 'var(--active)' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                })}
              >
                <UserCog size={16} />
                Users
              </NavLink>
            )}
            {isAdminOrSup && (
              <NavLink
                to="/settings/agents"
                className={({ isActive }) => navLink({ isActive })}
                style={({ isActive }) => ({
                  background: isActive ? 'var(--active)' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                })}
              >
                <Users size={16} />
                Agents
              </NavLink>
            )}
            <NavLink
              to="/settings/profile"
              className={({ isActive }) => navLink({ isActive })}
              style={({ isActive }) => ({
                background: isActive ? 'var(--active)' : 'transparent',
                color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              })}
            >
              <Settings size={16} />
              Profile
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer — clickable for popup instead of standalone logout icon */}
      <UserFooter />
    </aside>
  );
}

