import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { StatusPill } from '../components/design-system/StatusPill';
import { Button } from '../components/design-system/Button';
import { Modal } from '../components/design-system/Modal';
import { RoleAnnotation } from '../components/design-system/RoleAnnotation';
import { useRole } from '../context/RoleContext';
import { apiClient } from '../api/apiClient';

interface Vehicle {
  id: string;
  model: string;
  type: string;
  capacity: string;
  odometer: number;
  status: string;
}

export default function Vehicles() {
  const [showModal, setShowModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    model: '',
    licensePlate: '',
    type: 'Heavy Truck',
    capacity: '',
    purchaseDate: '',
    initialOdometer: '0',
  });
  const { hasAccess } = useRole();
  const canEdit = hasAccess(['Fleet Manager']);

  useEffect(() => {
    apiClient
      .get<Vehicle[]>('/vehicles')
      .then((data) => setVehicles(data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load vehicles'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'On Trip': return 'info';
      case 'In Shop': return 'warning';
      case 'Retired': return 'neutral';
      default: return 'default';
    }
  };

  const handleAddVehicle = async () => {
    setError('');
    try {
      const created = await apiClient.post<Vehicle & { code: string }>('/vehicles', {
        model: form.model,
        type: form.type,
        capacityKg: Number(form.capacity) || 0,
        odometerKm: Number(form.initialOdometer) || 0,
        licensePlate: form.licensePlate || undefined,
        purchaseDate: form.purchaseDate || undefined,
        initialOdometerKm: Number(form.initialOdometer) || 0,
      });
      setVehicles((prev) => [
        {
          id: created.code ?? created.id,
          model: created.model,
          type: created.type,
          capacity: `${created.capacityKg ?? 0} kg`,
          odometer: created.odometerKm ?? 0,
          status: created.status ?? 'Available',
        },
        ...prev,
      ]);
      setShowModal(false);
      setForm({ model: '', licensePlate: '', type: 'Heavy Truck', capacity: '', purchaseDate: '', initialOdometer: '0' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vehicle');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Asset Management</h1>
            <p className="text-gray-500 mt-1">Manage and monitor your complete fleet inventory</p>
          </div>
          <div className="flex items-center gap-3">
            {!canEdit && <RoleAnnotation roles={['Manager Only']} />}
            <Button onClick={() => setShowModal(true)} variant="primary" disabled={!canEdit}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odometer (km)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{vehicle.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vehicle.model}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vehicle.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vehicle.capacity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vehicle.odometer.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={vehicle.status} variant={getStatusVariant(vehicle.status)} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={!canEdit}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            disabled={!canEdit}
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add New Vehicle"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddVehicle}>
                Add Vehicle
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Volvo FH16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC-1234"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Heavy Truck</option>
                  <option>Medium Truck</option>
                  <option>Light Truck</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (kg)</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Odometer (km)</label>
                <input
                  type="number"
                  value={form.initialOdometer}
                  onChange={(e) => setForm((f) => ({ ...f, initialOdometer: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
