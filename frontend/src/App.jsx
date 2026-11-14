import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import { AuthModal, Toasts } from './components/Overlays';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Scanner from './pages/Scanner';
import Activity from './pages/Activity';
import Rules from './pages/Rules';
import Settings from './pages/Settings';

function NotFound() {
  return (
    <div className="page narrow">
      <section className="card empty-hero">
        <h2>Page not found</h2>
        <p className="muted">That address does not exist in PromptShield.</p>
        <div className="btn-row center"><Link className="btn btn-primary" to="/app/scanner">Open scanner</Link></div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="activity" element={<ProtectedRoute title="Activity History"><Activity /></ProtectedRoute>} />
          <Route path="rules" element={<Rules />} />
          <Route path="settings" element={<ProtectedRoute title="Account Settings"><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/scanner" element={<Navigate to="/app/scanner" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AuthModal />
      <Toasts />
    </>
  );
}
