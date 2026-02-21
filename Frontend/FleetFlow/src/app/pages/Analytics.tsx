import { useEffect, useState } from 'react';
import { FileDown, FileText } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/design-system/Button';
import { RoleAnnotation } from '../components/design-system/RoleAnnotation';
import { useRole } from '../context/RoleContext';
import { apiClient } from '../api/apiClient';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FuelEfficiencyPoint {
  month: string;
  efficiency: number;
  target: number;
}

interface FleetUtilizationPoint {
  vehicle: string;
  utilization: number;
}

const monthNames: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

const vehicleROIData = [
  { vehicle: 'VEH-001', roi: 145 },
  { vehicle: 'VEH-002', roi: 162 },
  { vehicle: 'VEH-003', roi: 98 },
  { vehicle: 'VEH-004', roi: 134 },
  { vehicle: 'VEH-005', roi: 156 },
  { vehicle: 'VEH-006', roi: 142 },
  { vehicle: 'VEH-007', roi: 118 },
];

const revenueExpenseData = [
  { month: 'Aug', revenue: 285000, expense: 198000 },
  { month: 'Sep', revenue: 310000, expense: 215000 },
  { month: 'Oct', revenue: 295000, expense: 205000 },
  { month: 'Nov', revenue: 330000, expense: 225000 },
  { month: 'Dec', revenue: 345000, expense: 238000 },
  { month: 'Jan', revenue: 320000, expense: 220000 },
  { month: 'Feb', revenue: 350000, expense: 240000 },
];

export default function Analytics() {
  const { hasAccess } = useRole();
  const canView = hasAccess(['Fleet Manager', 'Financial Analyst']);
  const [fuelEfficiencyData, setFuelEfficiencyData] = useState<FuelEfficiencyPoint[]>([]);
  const [fleetUtilizationData, setFleetUtilizationData] = useState<FleetUtilizationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    Promise.all([
      apiClient.get<FuelEfficiencyPoint[]>('/analytics/fuel-efficiency'),
      apiClient.get<FleetUtilizationPoint[]>('/analytics/fleet-utilization'),
    ])
      .then(([fuel, util]) => {
        setFuelEfficiencyData((fuel ?? []).map((d) => ({ ...d, month: monthNames[d.month] ?? d.month })));
        setFleetUtilizationData(util ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [canView]);

  if (!canView) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="mb-4">
              <RoleAnnotation roles={['Finance', 'Manager Only']} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Analytics & Reports are only accessible to Finance and Manager roles.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500 mt-1">Comprehensive insights and performance analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <RoleAnnotation roles={['Finance', 'Manager']} />
            <Button variant="secondary">
              <FileText className="w-4 h-4 mr-2 inline" />
              Export PDF
            </Button>
            <Button variant="primary">
              <FileDown className="w-4 h-4 mr-2 inline" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Efficiency Trend (km/L)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fuelEfficiencyData.length ? fuelEfficiencyData : [{ month: '-', efficiency: 0, target: 7 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" domain={[6, 8]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="efficiency" stroke="#2563eb" strokeWidth={3} name="Actual Efficiency" dot={{ fill: '#2563eb', r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" name="Target" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expense Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#f59e0b" name="Expense" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle ROI (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleROIData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="vehicle" type="category" stroke="#666" width={70} />
                <Tooltip />
                <Bar dataKey="roi" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Utilization Rate (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fleetUtilizationData.length ? fleetUtilizationData : [{ vehicle: '-', utilization: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="vehicle" stroke="#666" />
                <YAxis stroke="#666" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="utilization" radius={[8, 8, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Total Revenue (Feb)</p>
            <p className="text-2xl font-semibold text-gray-900">$350,000</p>
            <p className="text-sm text-green-600 mt-1">+8.2% vs Jan</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Total Expenses (Feb)</p>
            <p className="text-2xl font-semibold text-gray-900">$240,000</p>
            <p className="text-sm text-orange-600 mt-1">+4.1% vs Jan</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Net Profit (Feb)</p>
            <p className="text-2xl font-semibold text-gray-900">$110,000</p>
            <p className="text-sm text-green-600 mt-1">+15.8% vs Jan</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Average Fleet Utilization</p>
            <p className="text-2xl font-semibold text-gray-900">
              {fleetUtilizationData.length
                ? (fleetUtilizationData.reduce((s, d) => s + d.utilization, 0) / fleetUtilizationData.length).toFixed(1)
                : '0'}%
            </p>
            <p className="text-sm text-blue-600 mt-1">Target: 80%</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
