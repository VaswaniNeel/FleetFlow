import { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { StatusPill } from '../components/design-system/StatusPill';
import { Button } from '../components/design-system/Button';
import { Modal } from '../components/design-system/Modal';
import { RoleAnnotation } from '../components/design-system/RoleAnnotation';
import { useRole } from '../context/RoleContext';
import { apiClient } from '../api/apiClient';

interface Driver {
  id: string;
  name: string;
  license: string;
  expiry: string;
  completionRate: number;
  safetyScore: number;
  status: string;
}

export default function Drivers() {
  const [showModal, setShowModal] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    licenseType: 'CDL-A (Commercial Driver\'s License Class A)',
    licenseExpiry: '',
    email: '',
    phone: '',
  });
  const { hasAccess } = useRole();
  const hasPrimaryAccess = hasAccess(['Safety Officer', 'Fleet Manager']);

  useEffect(() => {
    apiClient
      .get<Driver[]>('/drivers')
      .then((data) => setDrivers(data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  const isLicenseExpired = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const expiredLicenses = drivers.filter((d) => isLicenseExpired(d.expiry));

  const handleAddDriver = async () => {
    setError('');
    try {
      const created = await apiClient.post<Driver & { code: string }>('/drivers', {
        name: form.name,
        licenseNumber: form.licenseNumber,
        licenseType: form.licenseType,
        licenseExpiry: form.licenseExpiry,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      setDrivers((prev) => [
        {
          id: created.code ?? created.id,
          name: created.name,
          license: created.licenseNumber ?? created.license,
          expiry: created.licenseExpiry ?? created.expiry,
          completionRate: created.completionRate ?? 0,
          safetyScore: created.safetyScore ?? 0,
          status: created.status ?? 'Active',
        },
        ...prev,
      ]);
      setShowModal(false);
      setForm({ name: '', licenseNumber: '', licenseType: 'CDL-A (Commercial Driver\'s License Class A)', licenseExpiry: '', email: '', phone: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add driver');
    }
  };

  const avgCompletion = drivers.length ? (drivers.reduce((s, d) => s + d.completionRate, 0) / drivers.length).toFixed(1) : '0';
  const avgSafety = drivers.length ? (drivers.reduce((s, d) => s + d.safetyScore, 0) / drivers.length).toFixed(1) : '0';
  const activeCount = drivers.filter((d) => d.status === 'Active').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Performance & Safety</h1>
            <p className="text-gray-500 mt-1">Monitor driver records, compliance, and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <RoleAnnotation roles={['Safety Officer', 'Manager']} />
            <Button onClick={() => setShowModal(true)} variant="primary">
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Driver
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {expiredLicenses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {expiredLicenses.length} driver{expiredLicenses.length > 1 ? 's have' : ' has'} expired license{expiredLicenses.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {expiredLicenses.map((d) => d.name).join(', ')} — Immediate action required
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {drivers.map((driver) => {
                    const expired = isLicenseExpired(driver.expiry);
                    const expiringSoon = isLicenseExpiringSoon(driver.expiry);
                    return (
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{driver.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{driver.license}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-orange-600' : 'text-gray-700'}>
                              {new Date(driver.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {expired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">EXPIRED</span>
                            )}
                            {expiringSoon && !expired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">EXPIRING SOON</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${driver.completionRate}%` }} />
                            </div>
                            <span className="font-medium">{driver.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  driver.safetyScore >= 90 ? 'bg-green-600' :
                                  driver.safetyScore >= 80 ? 'bg-blue-600' :
                                  driver.safetyScore >= 70 ? 'bg-orange-600' : 'bg-red-600'
                                }`}
                                style={{ width: `${driver.safetyScore}%` }}
                              />
                            </div>
                            <span className="font-medium">{driver.safetyScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={driver.status} variant={driver.status === 'Active' ? 'success' : 'neutral'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Average Completion Rate</p>
            <p className="text-2xl font-semibold text-gray-900">{avgCompletion}%</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Average Safety Score</p>
            <p className="text-2xl font-semibold text-gray-900">{avgSafety}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Active Drivers</p>
            <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Driver"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddDriver}>Add Driver</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CDL-A-1234567"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
              <select
                value={form.licenseType}
                onChange={(e) => setForm((f) => ({ ...f, licenseType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>CDL-A (Commercial Driver&apos;s License Class A)</option>
                <option>CDL-B (Commercial Driver&apos;s License Class B)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                value={form.licenseExpiry}
                onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="driver@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
