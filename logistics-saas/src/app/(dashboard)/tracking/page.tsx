'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import {
  MapPin,
  RefreshCw,
  Navigation,
  Clock,
  Truck,
  Gauge,
  Circle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface DriverLocation {
  driverId: string;
  driverName: string;
  truckId: string | null;
  position: {
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
  };
  isActive: boolean;
  sessionId: string;
}

export default function TrackingPage() {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/gps');
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    // Refresh every 15 seconds
    const interval = setInterval(fetchLocations, 15000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  const selectedLocation = selectedDriver
    ? locations.find((l) => l.driverId === selectedDriver)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">GPS Tracking</h1>
          <p className="text-gray-400">Real-time driver locations</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLocations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="relative h-[500px] rounded-xl overflow-hidden bg-gray-800">
              {/* Map placeholder - in production, use Mapbox or Google Maps */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Grid overlay for futuristic effect */}
                <div className="absolute inset-0 bg-grid opacity-30" />

                {/* Center info */}
                {locations.length === 0 && !loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No active drivers</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Drivers will appear here when they enable GPS tracking
                      </p>
                    </div>
                  </div>
                )}

                {/* Driver markers */}
                {locations.map((loc, index) => {
                  // Position markers in a grid for demo (in production, use real coordinates)
                  const col = index % 3;
                  const row = Math.floor(index / 3);
                  const left = 20 + col * 30;
                  const top = 20 + row * 25;

                  return (
                    <button
                      key={loc.driverId}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                        selectedDriver === loc.driverId ? 'z-10 scale-125' : 'z-0'
                      }`}
                      style={{ left: `${left}%`, top: `${top}%` }}
                      onClick={() => setSelectedDriver(loc.driverId)}
                    >
                      <div className={`relative ${selectedDriver === loc.driverId ? 'animate-pulse-glow' : ''}`}>
                        {/* Pulse effect */}
                        <div className="absolute inset-0 w-12 h-12 bg-cyan-500/20 rounded-full animate-ping" />
                        {/* Marker */}
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedDriver === loc.driverId
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50'
                            : 'bg-gray-700 border-2 border-cyan-500/50'
                        }`}>
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        {/* Name label */}
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-gray-900/90 rounded text-xs text-white whitespace-nowrap">
                          {loc.driverName}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                    <div className="loader" />
                  </div>
                )}
              </div>

              {/* Map controls placeholder */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button size="icon" variant="secondary" className="w-10 h-10">
                  +
                </Button>
                <Button size="icon" variant="secondary" className="w-10 h-10">
                  -
                </Button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 px-3 py-2 bg-gray-900/90 rounded-lg">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="status-dot active" />
                    <span className="text-gray-400">Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="status-dot inactive" />
                    <span className="text-gray-400">Inactive</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver List / Details */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{locations.length}</p>
                  <p className="text-xs text-gray-500">Active Drivers</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Driver Details */}
          {selectedLocation ? (
            <Card glow>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-400" />
                  {selectedLocation.driverName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLocation.truckId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Truck ID</span>
                    <span className="text-white font-mono">{selectedLocation.truckId}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge variant="success">
                    <Circle className="w-2 h-2 mr-1 fill-current" />
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last Update</span>
                  <span className="text-white">
                    {formatRelativeTime(new Date(selectedLocation.position.timestamp))}
                  </span>
                </div>

                {selectedLocation.position.speed !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Gauge className="w-4 h-4" />
                      Speed
                    </span>
                    <span className="text-white">
                      {selectedLocation.position.speed.toFixed(0)} mph
                    </span>
                  </div>
                )}

                {selectedLocation.position.heading !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      Heading
                    </span>
                    <span className="text-white">
                      {selectedLocation.position.heading.toFixed(0)}°
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Coordinates</p>
                  <p className="text-sm font-mono text-gray-400">
                    {selectedLocation.position.latitude.toFixed(6)}, {selectedLocation.position.longitude.toFixed(6)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  Select a driver on the map to see details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Driver List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">All Active Drivers</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No drivers currently tracking
                </p>
              ) : (
                <div className="space-y-1">
                  {locations.map((loc) => (
                    <button
                      key={loc.driverId}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        selectedDriver === loc.driverId
                          ? 'bg-cyan-500/20 border border-cyan-500/30'
                          : 'hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedDriver(loc.driverId)}
                    >
                      <div className="status-dot active" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {loc.driverName}
                        </p>
                        {loc.truckId && (
                          <p className="text-xs text-gray-500">{loc.truckId}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(new Date(loc.position.timestamp))}
                        </p>
                        {loc.position.speed !== null && (
                          <p className="text-xs text-cyan-400">
                            {loc.position.speed.toFixed(0)} mph
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
