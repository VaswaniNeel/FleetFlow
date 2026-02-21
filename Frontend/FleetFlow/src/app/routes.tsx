import { createBrowserRouter } from 'react-router';
import { lazy } from 'react';

const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Trips = lazy(() => import('./pages/Trips'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Auth,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/vehicles',
    Component: Vehicles,
  },
  {
    path: '/trips',
    Component: Trips,
  },
  {
    path: '/maintenance',
    Component: Maintenance,
  },
  {
    path: '/expenses',
    Component: Expenses,
  },
  {
    path: '/drivers',
    Component: Drivers,
  },
  {
    path: '/analytics',
    Component: Analytics,
  },
  {
    path: '/settings',
    Component: Settings,
  },
]);