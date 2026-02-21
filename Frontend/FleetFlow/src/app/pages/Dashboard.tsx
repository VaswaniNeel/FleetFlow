import { useEffect, useState } from 'react';
import { Truck, AlertTriangle, Package, TrendingUp, Activity } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { KPICard } from '../components/design-system/KPICard';
import { StatusPill } from '../components/design-system/StatusPill';
import { useRole } from '../context/RoleContext';
import { apiClient } from '../api/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Vehicle {
  id: string;
  model: string;
  type: string;
  capacity: string;
  odometer: number;
  status: string;
}

interface Trip {
  id: string;
  vehicle: string;
  driver: string;
  route: string;
  status: string;
  scheduledAt?: string | null;
  onTime: boolean;
}

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicle: string;
  issue: string;
  date: string;
  cost: number;
  status: string;
}

const fleetStatusData = [
  { day: 'Mon', active: 6, inactive: 2 },
  { day: 'Tue', active: 7, inactive: 1 },
  { day: 'Wed', active: 5, inactive: 3 },
  { day: 'Thu', active: 6, inactive: 2 },
  { day: 'Fri', active: 7, inactive: 1 },
  { day: 'Sat', active: 4, inactive: 4 },
  { day: 'Sun', active: 3, inactive: 5 },
];

export default function Dashboard() {
  const { user } = useRole();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get<Vehicle[]>('/vehicles'),
      apiClient.get<Trip[]>('/trips'),
      apiClient.get<MaintenanceLog[]>('/maintenance'),
    ])
      .then(([v, t, m]) => {
        setVehicles(v ?? []);
        setTrips(t ?? []);
        setMaintenance(m ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const inProgressMaintenanceLogs = maintenance.filter((m) => m.status === 'In Progress');
  const overdueMaintenance = maintenance.filter((m) => {
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d < today && m.status !== 'Completed';
  });
  const dueSoonMaintenance = maintenance.filter((m) => {
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return m.status === 'Scheduled' && d >= today && d <= inSevenDays;
  });
  const maintenanceAlerts = inProgressMaintenanceLogs.length + overdueMaintenance.length + dueSoonMaintenance.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'On Trip').length;
  const pendingCargo = trips.filter((t) => t.status === 'Dispatched').length;
  const utilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;

  const recentTrips = trips.slice(0, 5);
  const alerts = [
    ...inProgressMaintenanceLogs.map((m) => ({
      id: `m-ip-${m.id}`,
      type: 'warning' as const,
      message: `In shop: ${m.vehicleId || ''} (${m.vehicle}) - ${m.issue}`,
      time: 'In progress',
    })),
    ...overdueMaintenance.map((m) => ({
      id: `m-over-${m.id}`,
      type: 'warning' as const,
      message: `Overdue: ${m.vehicleId || ''} (${m.vehicle}) - ${m.issue}`,
      time: new Date(m.date).toLocaleDateString(),
    })),
    ...dueSoonMaintenance.map((m) => ({
      id: `m-due-${m.id}`,
      type: 'info' as const,
      message: `Due soon: ${m.vehicleId || ''} (${m.vehicle}) - ${m.issue}`,
      time: new Date(m.date).toLocaleDateString(),
    })),
    { id: 'lic', type: 'info' as const, message: 'Check driver license expiries on Drivers page', time: '5 hours ago' },
    ...recentTrips
      .filter((t) => t.status === 'Completed')
      .slice(0, 1)
      .map((t) => ({
        id: `t-${t.id}`,
        type: 'success' as const,
        message: `Trip ${t.id} completed`,
        time: '1 day ago',
      })),
  ].slice(0, 8);

  const renderKPIs = () => {
    if (user?.role === 'Financial Analyst') {
      return (
        <>
          <KPICard title="Monthly Revenue" value="$350,000" icon={TrendingUp} color="green" trend={{ value: '+8.2% vs last month', isPositive: true }} />
          <KPICard title="Total Expenses" value="$240,000" icon={AlertTriangle} color="orange" trend={{ value: '+4.1% vs last month', isPositive: false }} />
          <KPICard title="Profit Margin" value="31.4%" icon={Activity} color="blue" trend={{ value: '+2.3% improvement', isPositive: true }} />
          <KPICard title="Cost per KM" value="$1.85" icon={Package} color="blue" />
        </>
      );
    }

    if (user?.role === 'Safety Officer') {
      return (
        <>
          <KPICard title="Active Fleet" value={activeVehicles} icon={Truck} color="blue" />
          <KPICard title="Safety Compliance" value="94.5%" icon={AlertTriangle} color="green" trend={{ value: '+2.1% this month', isPositive: true }} />
          <KPICard title="Maintenance Alerts" value={maintenanceAlerts} icon={AlertTriangle} color="red" />
          <KPICard title="License Expiries" value="—" icon={Package} color="orange" />
        </>
      );
    }

    if (user?.role === 'Dispatcher') {
      return (
        <>
          <KPICard title="Active Trips" value={pendingCargo} icon={Package} color="blue" />
          <KPICard title="Available Vehicles" value={vehicles.filter((v) => v.status === 'Available').length} icon={Truck} color="green" />
          <KPICard title="On-Time Rate" value="87.3%" icon={TrendingUp} color="green" trend={{ value: '+5.2% vs last week', isPositive: true }} />
          <KPICard title="Active Drivers" value="—" icon={Activity} color="blue" />
        </>
      );
    }

    return (
      <>
        <KPICard title="Active Fleet" value={activeVehicles} icon={Truck} color="blue" trend={{ value: '+2 since yesterday', isPositive: true }} />
        <KPICard title="Maintenance Alerts" value={maintenanceAlerts} icon={AlertTriangle} color="red" />
        <KPICard title="Pending Cargo" value={pendingCargo} icon={Package} color="orange" />
        <KPICard title="Utilization Rate" value={`${utilization}%`} icon={TrendingUp} color="green" trend={{ value: '+12% vs last week', isPositive: true }} />
      </>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-500 mt-1">Fleet operations overview and real-time monitoring</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {renderKPIs()}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status - Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fleetStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Line type="monotone" dataKey="active" stroke="#2563eb" strokeWidth={2} name="Active" />
                <Line type="monotone" dataKey="inactive" stroke="#9ca3af" strokeWidth={2} name="Inactive" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500">No alerts</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start gap-2 mb-1">
                      {alert.type === 'warning' && <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5" />}
                      {alert.type === 'info' && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />}
                      {alert.type === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />}
                      <p className="text-sm text-gray-900 flex-1">{alert.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 ml-4">{alert.time}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Trips</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No trips yet
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{trip.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.vehicle}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.driver}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.route}</td>
                      <td className="px-6 py-4">
                        <StatusPill
                          status={trip.status}
                          variant={
                            trip.status === 'Completed' ? 'success' :
                            trip.status === 'Dispatched' ? 'info' :
                            trip.status === 'Draft' ? 'neutral' : 'danger'
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        {trip.status === 'Dispatched' || trip.status === 'Completed' ? (
                          trip.onTime ? (
                            <span className="text-green-600 text-sm">✓ On Time</span>
                          ) : (
                            <span className="text-red-600 text-sm">✗ Delayed</span>
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
