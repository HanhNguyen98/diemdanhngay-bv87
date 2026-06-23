import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { api } from './api/client';
import { subscribeSessionExpired } from './api/sessionEvents';
import {
  AppBootstrapProvider,
  clearSessionCache,
  fetchSessionUser,
} from './context/AppBootstrapContext';
import RouteErrorBoundary from './components/shared/RouteErrorBoundary';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
const AdminApp = lazy(() => import('./components/admin/AdminApp'));

function AppShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('attendance');
  const sessionCheckedRef = useRef(false);

  useEffect(() => {
    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;

    (async () => {
      try {
        const me = await fetchSessionUser();
        setUser(me);
        if (me.role === 'ADMIN') {
          setView('admin');
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    return subscribeSessionExpired(() => {
      clearSessionCache();
      setUser(null);
      setView('attendance');
    });
  }, []);

  const handleLogin = (userData) => {
    clearSessionCache();
    setUser(userData);
    setView(userData.role === 'ADMIN' ? 'admin' : 'attendance');
  };

  const handleLogout = async () => {
    await api.logout();
    clearSessionCache();
    setUser(null);
    setView('attendance');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-white text-lg animate-pulse">Đang tải hệ thống...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (user.role === 'ADMIN' && view === 'admin') {
    return (
      <RouteErrorBoundary title="Không tải được cổng quản trị">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface-page">
              <div className="text-content-muted animate-pulse">Đang tải cổng quản trị...</div>
            </div>
          }
        >
          <AdminApp user={user} onLogout={handleLogout} />
        </Suspense>
      </RouteErrorBoundary>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <AppBootstrapProvider>
      <AppShell />
    </AppBootstrapProvider>
  );
}

