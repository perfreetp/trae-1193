import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Sidebar, Header } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Sources from '@/pages/Sources';
import Diff from '@/pages/Diff';
import Impact from '@/pages/Impact';
import Alerts from '@/pages/Alerts';
import Review from '@/pages/Review';
import Reports from '@/pages/Reports';
import NotFound from '@/pages/NotFound';
import { cn } from '@/lib/utils';

function AppLayout() {
  return (
    <div className={cn('flex h-screen bg-ink-50 overflow-hidden')}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 gradient-mesh-bg">
          <div className="mx-auto w-full max-w-[1600px] min-h-full">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/diff" element={<Diff />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/review" element={<Review />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
