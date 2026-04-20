import { createBrowserRouter, Navigate} from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';

// Pages
import { LoginPage }               from '../pages/auth/LoginPage';
import { InboxPage }               from '../pages/Inbox/InboxPage';
import { ConversationsPage }       from '../pages/conversations/ConversationPage';
import { ConversationDetailPage }  from '../pages/conversations/ConversationDetailPage';
import { SearchPage }              from '../pages/search/SearchPage';
import { ClientsPage }             from '../pages/clients/ClientPage';
import { ClientDetailPage }        from '../pages/clients/ClientDetailPage';
import { AgentsPage }              from '../pages/agents/AgentsPage';
import { UsersPage }               from '../pages/settings/UsersPage';
import { ProfilePage }             from '../pages/settings/ProfilePage';
import { RequireAuth, RequireRole } from '../app/guards';


export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },

  // Protected
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/',                  element: <Navigate to="/conversations" replace /> },
          { path: '/inbox',             element: <InboxPage /> },
          { path: '/search',            element: <SearchPage /> },
          { path: '/conversations',     element: <ConversationsPage /> },
          { path: '/conversations/:id', element: <ConversationDetailPage /> },
          { path: '/settings/profile',  element: <ProfilePage /> },

          // Agent or supervisor
          {
            element: <RequireRole roles={['admin', 'supervisor', 'agent']} />,
            children: [
              { path: '/clients',     element: <ClientsPage /> },
              { path: '/clients/:id', element: <ClientDetailPage /> },
            ],
          },

          // Supervisor + admin only
          {
            element: <RequireRole roles={['admin', 'supervisor']} />,
            children: [
              { path: '/settings/agents', element: <AgentsPage /> },
            ],
          },

          // Admin only
          {
            element: <RequireRole roles={['admin']} />,
            children: [
              { path: '/settings/users', element: <UsersPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/conversations" replace /> },
]);