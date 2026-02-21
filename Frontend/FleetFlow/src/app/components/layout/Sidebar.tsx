import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Truck, 
  Route, 
  Wrench, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { useRole, UserRole } from '../../context/RoleContext';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  { 
    to: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    allowedRoles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']
  },
  { 
    to: '/vehicles', 
    label: 'Vehicle Registry', 
    icon: Truck,
    allowedRoles: ['Fleet Manager', 'Dispatcher']
  },
  { 
    to: '/trips', 
    label: 'Trip Dispatcher', 
    icon: Route,
    allowedRoles: ['Fleet Manager', 'Dispatcher']
  },
  { 
    to: '/maintenance', 
    label: 'Maintenance Logs', 
    icon: Wrench,
    allowedRoles: ['Fleet Manager', 'Safety Officer']
  },
  { 
    to: '/expenses', 
    label: 'Expense & Fuel', 
    icon: DollarSign,
    allowedRoles: ['Fleet Manager', 'Financial Analyst']
  },
  { 
    to: '/drivers', 
    label: 'Driver Performance', 
    icon: Users,
    allowedRoles: ['Fleet Manager', 'Safety Officer']
  },
  { 
    to: '/analytics', 
    label: 'Analytics & Reports', 
    icon: BarChart3,
    allowedRoles: ['Fleet Manager', 'Financial Analyst']
  },
  { 
    to: '/settings', 
    label: 'Settings', 
    icon: Settings,
    allowedRoles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']
  },
];

export function Sidebar() {
  const { user } = useRole();

  // Filter navigation items based on user role
  const accessibleNavItems = navItems.filter(item => 
    user?.role && item.allowedRoles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FleetFlow</h1>
            <p className="text-xs text-gray-500">Fleet Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {accessibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}