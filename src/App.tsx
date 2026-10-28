/**
 * AI Student Learning & Career Success Platform
 * "LearnAI" — Learn Smarter. Practice Better. Build Your Career.
 */

import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSetup } from './pages/AdminSetup';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { MentorDashboard } from './pages/MentorDashboard';
import { Sparkles, ArrowLeft } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentPath, navigate } = useRouter();

  // Route matching
  const renderRoute = () => {
    switch (currentPath) {
      case '/':
      case '/features':
      case '/solutions':
      case '/about':
      case '/contact':
        return <Home />;
      case '/login':
        return <Login />;
      case '/signup':
        return <Signup />;
      case '/admin-setup':
        return <AdminSetup />;
      case '/dashboard':
      case '/student':
      case '/student/dashboard':
      case '/student-dashboard':
        return <Dashboard />;
      case '/profile':
        return <Profile />;
      case '/admin':
      case '/admin/dashboard':
      case '/admin-dashboard':
      case '/super-admin':
      case '/super-admin/dashboard':
      case '/super-admin-dashboard':
        return <AdminDashboard />;
      case '/admin/verification-codes':
        return <AdminDashboard initialTab="codes" />;
      case '/admin/pending':
        return <AdminDashboard initialTab="pending" />;
      case '/trainer':
      case '/trainer/dashboard':
      case '/trainer-dashboard':
        return <TrainerDashboard />;
      case '/mentor':
      case '/mentor/dashboard':
      case '/mentor-dashboard':
        return <MentorDashboard />;
      default:
        return (
          <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center space-y-4 shadow-card">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Page Not Found
              </h2>
              <p className="text-xs sm:text-sm text-[#475569]">
                The requested URL route ({currentPath}) does not exist or has been relocated.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-subtle transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Homepage</span>
              </button>
            </div>
          </div>
        );
    }
  };

  const isFullDashboardRoute =
    currentPath === '/dashboard' ||
    currentPath.startsWith('/student') ||
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/') ||
    currentPath.startsWith('/super-admin') ||
    currentPath.startsWith('/trainer') ||
    currentPath.startsWith('/mentor');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />
      <main className="flex-1">
        {renderRoute()}
      </main>
      {!isFullDashboardRoute && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <MainContent />
    </RouterProvider>
  );
}
