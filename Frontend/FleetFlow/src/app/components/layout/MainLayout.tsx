import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useRole } from '../../context/RoleContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, authChecked } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authChecked) return;
    if (!user) navigate('/');
  }, [user, authChecked, navigate]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}