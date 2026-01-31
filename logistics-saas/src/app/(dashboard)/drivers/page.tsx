'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Truck,
  Download,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  truckId: string | null;
  licenseNumber: string | null;
  isActive: boolean;
  user: { name: string; email: string } | null;
  gpsSessions: { isActive: boolean }[];
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const res = await fetch(`/api/drivers?${params}`);
      const data = await res.json();
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  function handleExportMileage() {
    window.open('/api/export/mileage', '_blank');
  }

  const activeDrivers = drivers.filter((d) => d.gpsSessions?.some((s) => s.isActive));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-gray-400">Manage your drivers and view mileage</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportMileage}>
            <Download className="w-4 h-4 mr-2" />
            Export Mileage
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{drivers.length}</p>
              <p className="text-xs text-gray-500">Total Drivers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeDrivers.length}</p>
              <p className="text-xs text-gray-500">Active Now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search drivers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchDrivers}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Driver List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loader" />
        </div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No drivers found</h3>
            <p className="text-gray-500 text-center max-w-sm mb-4">
              Add your first driver to start tracking mileage and locations
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => {
            const isTracking = driver.gpsSessions?.some((s) => s.isActive);
            return (
              <Card key={driver.id} className="hover:border-gray-700 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-lg">
                        {driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{driver.name}</h3>
                        <div className="flex items-center gap-2">
                          {isTracking ? (
                            <Badge variant="success">
                              <div className="status-dot active mr-1" />
                              Tracking
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Offline</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    {driver.truckId && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Truck className="w-4 h-4" />
                        <span>{driver.truckId}</span>
                      </div>
                    )}
                    {driver.phone && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${driver.phone}`} className="hover:text-cyan-400">
                          {driver.phone}
                        </a>
                      </div>
                    )}
                    {driver.email && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${driver.email}`} className="hover:text-cyan-400 truncate">
                          {driver.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {driver.user && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500">
                        Has login access as {driver.user.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Driver Modal */}
      <AddDriverModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchDrivers();
        }}
      />
    </div>
  );
}

function AddDriverModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    truckId: '',
    licenseNumber: '',
    createUserAccount: false,
    userPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        setFormData({
          name: '',
          phone: '',
          email: '',
          truckId: '',
          licenseNumber: '',
          createUserAccount: false,
          userPassword: '',
        });
      } else {
        setError(data.error || 'Failed to add driver');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
          <DialogDescription>
            Add a driver to your company. You can optionally create a login account for them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="driver@company.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truckId">Truck ID</Label>
              <Input
                id="truckId"
                placeholder="TRK-001"
                value={formData.truckId}
                onChange={(e) => updateField('truckId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="CDL123456"
                value={formData.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Create Login Account</p>
                <p className="text-xs text-gray-500">
                  Allow this driver to log in and track their GPS
                </p>
              </div>
              <Switch
                checked={formData.createUserAccount}
                onCheckedChange={(checked) => updateField('createUserAccount', checked)}
              />
            </div>

            {formData.createUserAccount && (
              <div className="space-y-2">
                <Label htmlFor="userPassword">Temporary Password *</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.userPassword}
                  onChange={(e) => updateField('userPassword', e.target.value)}
                  required={formData.createUserAccount}
                  minLength={8}
                />
                <p className="text-xs text-gray-500">
                  The driver will use their email to log in
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Driver
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
