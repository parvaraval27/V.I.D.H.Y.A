// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/home';
import DsaHelper from '@/pages/dsa-helper';
import LoginPage from './pages/LoginPage';
import NotFound from '@/pages/not-found';
import CareerCanvas from '@/pages/career-canvas';
import { TaskDashboardPage } from '@/pages/task-dashboard';
import { TaskDetailPage } from '@/pages/task-detail';
import TaskBoardPage from '@/pages/task-board';
import CalendarPage from '@/pages/calendar';
import { ToastProvider } from "@/components/ui/toast"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <Toaster />
          <Router future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
          <AppRouter />
          </Router>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={user ? <Home /> : <Navigate to="/login" />}
      />
      <Route
        path="/dsa"
        element={user ? <DsaHelper /> : <Navigate to="/login" />}
      />
      <Route
        path="/career"
        element={user ? <CareerCanvas /> : <Navigate to="/login" />}
      />
      <Route
        path="/tasks"
        element={user ? <TaskDashboardPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/tasks/board"
        element={user ? <TaskBoardPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/tasks/:id"
        element={user ? <TaskDetailPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/calendar"
        element={user ? <CalendarPage /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;