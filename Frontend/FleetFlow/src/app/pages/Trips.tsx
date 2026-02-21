import { useState, useEffect } from 'react';
import { Send, Check, X } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { StatusPill } from '../components/design-system/StatusPill';
import { Button } from '../components/design-system/Button';
import { RoleAnnotation } from '../components/design-system/RoleAnnotation';
import { useRole } from '../context/RoleContext';
import { apiClient } from '../api/apiClient';

interface Vehicle {
  id: string;
  model: string;
  status: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
}

interface Trip {
  id: string;
  vehicleId: string;
  vehicle: string;
  driverId: string;
  driver: string;
  route: string;
  cargoWeight: number;
  status: string;
  scheduledAt?: string | null;
  onTime: boolean;
}

export default function Trips() {
  const { hasAccess } = useRole();
  const canDispatch = hasAccess(['Fleet Manager', 'Dispatcher']);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    origin: '',
    destination: '',
    estimatedFuel: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
  });

  const loadData = () => {
    return Promise.all([
      apiClient.get<Trip[]>('/trips'),
      apiClient.get<Vehicle[]>('/vehicles'),
      apiClient.get<Driver[]>('/drivers'),
    ]).then(([t, v, d]) => {
      setTrips(t ?? []);
      setVehicles(v ?? []);
      setDrivers(d ?? []);
    });
  };

  useEffect(() => {
    loadData()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Dispatched': return 'info';
      case 'Draft': return 'neutral';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const activeDrivers = drivers.filter((d) => d.status === 'Active');

  const handleUpdateStatus = async (tripCode: string, newStatus: 'Completed' | 'Cancelled') => {
    setError('');
    try {
      await apiClient.patch(`/trips/${tripCode}`, { status: newStatus });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    }
  };

  const handleDispatch = async () => {
    setError('');
    try {
      const created = await apiClient.post<Trip & { code: string; vehicle?: string; driver?: string }>('/trips', {
        vehicleCode: formData.vehicleId,
        driverCode: formData.driverId,
        cargoWeightKg: Number(formData.cargoWeight) || 0,
        origin: formData.origin,
        destination: formData.destination,
        estimatedFuelCost: Number(formData.estimatedFuel) || 0,
        status: 'Dispatched',
        scheduledAt: formData.scheduledAt || undefined,
      });
      await loadData();
      setFormData({
        vehicleId: '',
        driverId: '',
        cargoWeight: '',
        origin: '',
        destination: '',
        estimatedFuel: '',
        scheduledAt: new Date().toISOString().slice(0, 16),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch trip');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Dispatcher</h1>
          <p className="text-gray-500 mt-1">Create and manage trip assignments</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Create New Trip</h2>
            {!canDispatch && <RoleAnnotation roles={['Dispatcher', 'Manager']} />}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose vehicle...</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.id} - {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose driver...</option>
                {activeDrivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Weight (kg)</label>
              <input
                type="number"
                value={formData.cargoWeight}
                onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="20000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Chicago, IL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Dallas, TX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Fuel Cost ($)</label>
              <input
                type="number"
                value={formData.estimatedFuel}
                onChange={(e) => setFormData({ ...formData, estimatedFuel: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                disabled={!canDispatch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <Button variant="primary" disabled={!canDispatch} onClick={handleDispatch}>
            <Send className="w-4 h-4 mr-2 inline" />
            Dispatch Trip
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Trips</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo (kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On Time</th>
                    {canDispatch && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{trip.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {trip.scheduledAt
                          ? new Date(trip.scheduledAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.vehicle}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.driver}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.route}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trip.cargoWeight.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={trip.status} variant={getStatusVariant(trip.status)} />
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
                      {canDispatch && (
                        <td className="px-6 py-4">
                          {trip.status === 'Dispatched' && (
                            <span className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(trip.id, 'Completed')}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                <Check className="w-3 h-3 mr-1" /> Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(trip.id, 'Cancelled')}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                              >
                                <X className="w-3 h-3 mr-1" /> Cancel
                              </button>
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
