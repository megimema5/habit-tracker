import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth';
import { AppLayout, AuthLayout } from './components/layout';
import { HabitDetailPage } from './pages/HabitDetailPage';
import { LoginPage } from './pages/LoginPage';
import { ManageHabitsPage } from './pages/ManageHabitsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { RegisterPage } from './pages/RegisterPage';
import { StatsPage } from './pages/StatsPage';
import { TodayPage } from './pages/TodayPage';

/**
 * All routes.
 * - PublicOnlyRoute: login/register — logged-in users are sent into the app.
 * - ProtectedRoute: everything else — logged-out users are sent to /login.
 */
export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/habits" element={<ManageHabitsPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          {import.meta.env.DEV && <Route path="/playground" element={<PlaygroundPage />} />}
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
