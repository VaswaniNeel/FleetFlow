import { RouterProvider } from 'react-router';
import { Suspense } from 'react';
import { RoleProvider } from './context/RoleContext';
import { router } from './routes';

export default function App() {
  return (
    <RoleProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    </RoleProvider>
  );
}