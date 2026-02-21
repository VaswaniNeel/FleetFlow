import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Fuel } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { KPICard } from '../components/design-system/KPICard';
import { RoleAnnotation } from '../components/design-system/RoleAnnotation';
import { useRole } from '../context/RoleContext';
import { apiClient } from '../api/apiClient';

interface Trip {
  id: string;
  driver: string;
  distance: number;
  fuelUsed: number;
  fuelCost: number;
  status: string;
}

interface ExpenseSummary {
  totalFuelCost: number;
  totalDistance: number;
  totalFuelUsed: number;
  maintenanceCost: number;
  costPerKm: number;
}

export default function Expenses() {
  const { hasAccess } = useRole();
  const canView = hasAccess(['Fleet Manager', 'Financial Analyst']);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    Promise.all([
      apiClient.get<Trip[]>('/trips'),
      apiClient.get<ExpenseSummary>('/analytics/expenses'),
    ])
      .then(([t, s]) => {
        setTrips(t ?? []);
        setSummary(s ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [canView]);

  const completedTrips = trips.filter((t) => t.status === 'Completed');
  const totalFuelCost = summary?.totalFuelCost ?? completedTrips.reduce((sum, t) => sum + (t.fuelCost ?? 0), 0);
  const totalDistance = summary?.totalDistance ?? completedTrips.reduce((sum, t) => sum + (t.distance ?? 0), 0);
  const totalFuelUsed = summary?.totalFuelUsed ?? completedTrips.reduce((sum, t) => sum + (t.fuelUsed ?? 0), 0);
  const maintenanceCost = summary?.maintenanceCost ?? 0;
  const costPerKm = summary?.costPerKm ?? (totalDistance > 0 ? (totalFuelCost / totalDistance).toFixed(2) : '0');

  if (!canView) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="mb-4">
              <RoleAnnotation roles={['Finance', 'Manager Only']} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">This module is only accessible to Finance and Manager roles.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Expense & Fuel Logging</h1>
            <p className="text-gray-500 mt-1">Track fuel consumption and operational expenses</p>
          </div>
          <RoleAnnotation roles={['Finance', 'Manager']} />
        </div>

        <div className="grid grid-cols-4 gap-6">
          <KPICard
            title="Monthly Fuel Cost"
            value={`$${totalFuelCost.toLocaleString()}`}
            icon={Fuel}
            color="orange"
            trend={{ value: '+8.2% vs last month', isPositive: false }}
          />
          <KPICard
            title="Maintenance Cost"
            value={`$${maintenanceCost.toLocaleString()}`}
            icon={DollarSign}
            color="red"
          />
          <KPICard
            title="Cost per KM"
            value={`$${typeof costPerKm === 'number' ? costPerKm.toFixed(2) : costPerKm}`}
            icon={TrendingUp}
            color="blue"
            trend={{ value: '-3.1% improvement', isPositive: true }}
          />
          <KPICard
            title="Total Distance (km)"
            value={totalDistance.toLocaleString()}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Expense Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Trip Expense Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance (km)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel Used (L)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/km</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedTrips.map(trip => {
                  const dist = trip.distance || 1;
                  const tripCostPerKm = (trip.fuelCost / dist).toFixed(2);
                  return (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{trip.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.driver}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.distance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.fuelUsed.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${trip.fuelCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">${tripCostPerKm}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        ${trip.fuelCost.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900">TOTALS</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{totalDistance.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{totalFuelUsed.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${totalFuelCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${typeof costPerKm === 'number' ? costPerKm.toFixed(2) : costPerKm}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${totalFuelCost.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Efficiency Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Average L/100km</span>
                <span className="text-sm font-medium text-gray-900">
                  {totalDistance > 0 ? ((totalFuelUsed / totalDistance) * 100).toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Best Trip Efficiency</span>
                <span className="text-sm font-medium text-green-600">35.8 L/100km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Worst Trip Efficiency</span>
                <span className="text-sm font-medium text-red-600">39.2 L/100km</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Fuel Costs</span>
                <span className="text-sm font-medium text-gray-900">${totalFuelCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Maintenance Costs</span>
                <span className="text-sm font-medium text-gray-900">${maintenanceCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Operating Costs</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${(totalFuelCost + maintenanceCost).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
