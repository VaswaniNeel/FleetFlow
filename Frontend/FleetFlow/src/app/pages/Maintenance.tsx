import { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { StatusPill } from '../components/design-system/StatusPill';
import { Button } from '../components/design-system/Button';
import { Modal } from '../components/design-system/Modal';
import { apiClient } from '../api/apiClient';

interface Vehicle {
  id: string;
  model: string;
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

export default function Maintenance() {
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    vehicleId: '',
    issue: '',
    cost: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Scheduled',
  });

  useEffect(() => {
    Promise.all([
      apiClient.get<MaintenanceLog[]>('/maintenance'),
      apiClient.get<Vehicle[]>('/vehicles'),
    ])
      .then(([m, v]) => {
        setLogs(m ?? []);
        setVehicles(v ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Scheduled': return 'info';
      default: return 'default';
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const inProgress = logs.filter((l) => l.status === 'In Progress');
  const overdue = logs.filter((l) => {
    const d = new Date(l.date);
    d.setHours(0, 0, 0, 0);
    return d < today && l.status !== 'Completed';
  });
  const dueSoon = logs.filter((l) => {
    const d = new Date(l.date);
    d.setHours(0, 0, 0, 0);
    return l.status === 'Scheduled' && d >= today && d <= inSevenDays;
  });
  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0);
  const avgCost = logs.length ? Math.round(totalCost / logs.length) : 0;
  const scheduledCount = logs.filter((l) => l.status === 'Scheduled').length;

  const handleLogService = async () => {
    setError('');
    try {
      const created = await apiClient.post<MaintenanceLog & { code: string }>('/maintenance', {
        vehicleCode: form.vehicleId,
        issue: form.issue,
        date: form.date,
        cost: Number(form.cost) || 0,
        status: form.status,
      });
      const vehicleName = vehicles.find((v) => v.id === form.vehicleId)?.model ?? '';
      setLogs((prev) => [
        {
          id: created.code ?? created.id,
          vehicleId: form.vehicleId,
          vehicle: vehicleName,
          issue: created.issue,
          date: created.date,
          cost: created.cost,
          status: created.status,
        },
        ...prev,
      ]);
      setShowModal(false);
      setForm({ vehicleId: '', issue: '', cost: '', date: new Date().toISOString().slice(0, 10), status: 'Scheduled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log service');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance & Service Logs</h1>
            <p className="text-gray-500 mt-1">Track vehicle maintenance and service history</p>
          </div>
          <Button onClick={() => setShowModal(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Log Service
          </Button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {inProgress.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                {inProgress.length} vehicle{inProgress.length > 1 ? 's' : ''} currently in shop
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {inProgress.map((l) => `${l.vehicleId || l.vehicle} - ${l.issue}`).join('; ')}
              </p>
            </div>
          </div>
        )}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {overdue.length} overdue maintenance item{overdue.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {overdue.map((l) => `${l.vehicleId || l.vehicle} - ${l.issue} (due ${new Date(l.date).toLocaleDateString()})`).join('; ')}
              </p>
            </div>
          </div>
        )}
        {dueSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {dueSoon.length} maintenance due in next 7 days
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {dueSoon.map((l) => `${l.vehicleId || l.vehicle} - ${l.issue} (${new Date(l.date).toLocaleDateString()})`).join('; ')}
              </p>
            </div>
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Log ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue / Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {log.vehicle}
                        {log.status === 'In Progress' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            In Shop
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.issue}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">${log.cost.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={log.status} variant={getStatusVariant(log.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Total Maintenance Cost</p>
            <p className="text-2xl font-semibold text-gray-900">${totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Average Cost per Service</p>
            <p className="text-2xl font-semibold text-gray-900">${avgCost.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Upcoming Scheduled Services</p>
            <p className="text-2xl font-semibold text-gray-900">{scheduledCount}</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Log New Service"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogService}>Log Service</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.id} - {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Description</label>
            <textarea
              rows={3}
              value={form.issue}
              onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the maintenance or repair work..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost ($)</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
