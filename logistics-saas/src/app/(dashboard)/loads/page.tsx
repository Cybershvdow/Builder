'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime, formatRelativeTime, formatCurrency } from '@/lib/utils';
import {
  Package,
  Search,
  Mail,
  Phone,
  FileText,
  Check,
  X,
  Download,
  RefreshCw,
  ChevronRight,
  MapPin,
  DollarSign,
  Truck,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { LoadDetailModal } from '@/components/dashboard/load-detail-modal';

interface ExtractedFields {
  pickup?: { location?: string };
  dropoff?: { location?: string };
  rate?: { amount?: number };
  equipment?: string;
  referenceNumber?: string;
}

interface LoadOffer {
  id: string;
  sourceType: string;
  senderName: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  senderCompany: string | null;
  subject: string | null;
  bodyText: string | null;
  extractedFields: ExtractedFields | null;
  status: string;
  receivedAt: string;
  decisionAt: string | null;
  decidedBy: { name: string } | null;
  assignedDriver: { name: string } | null;
}

export default function LoadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loads, setLoads] = useState<LoadOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedLoad, setSelectedLoad] = useState<LoadOffer | null>(null);

  const status = searchParams.get('status') || '';
  const sourceType = searchParams.get('sourceType') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (sourceType) params.set('sourceType', sourceType);
      if (search) params.set('search', search);
      params.set('page', page.toString());

      const res = await fetch(`/api/loads?${params}`);
      const data = await res.json();
      if (data.success) {
        setLoads(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch loads:', error);
    } finally {
      setLoading(false);
    }
  }, [status, sourceType, search, page]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/loads?${params.toString()}`);
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (sourceType) params.set('sourceType', sourceType);
    window.open(`/api/export/loads?${params}`, '_blank');
  }

  function getStatusBadge(loadStatus: string) {
    switch (loadStatus) {
      case 'NEW':
        return <Badge variant="new">New</Badge>;
      case 'PENDING':
        return <Badge variant="pending">Pending</Badge>;
      case 'ACCEPTED':
        return <Badge variant="accepted">Accepted</Badge>;
      case 'DENIED':
        return <Badge variant="denied">Denied</Badge>;
      case 'EXPIRED':
        return <Badge variant="expired">Expired</Badge>;
      default:
        return <Badge variant="secondary">{loadStatus}</Badge>;
    }
  }

  function getSourceIcon(source: string) {
    switch (source) {
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'PHONE':
        return <Phone className="w-4 h-4" />;
      case 'MANUAL':
        return <FileText className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Offers</h1>
          <p className="text-gray-400">Manage incoming load offers from all sources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLoads}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Source tabs */}
        <Tabs value={sourceType || 'all'} onValueChange={(v) => updateFilter('sourceType', v === 'all' ? '' : v)}>
          <TabsList>
            <TabsTrigger value="all">All Sources</TabsTrigger>
            <TabsTrigger value="EMAIL">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="PHONE">
              <Phone className="w-4 h-4 mr-1" />
              Phone
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search loads..."
              className="pl-9"
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Status filter */}
          <Select value={status || 'all'} onValueChange={(v) => updateFilter('status', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="DENIED">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {loads.length} of {total} load offers
      </p>

      {/* Loads list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loader" />
        </div>
      ) : loads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No load offers found</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {search || status || sourceType
                ? 'Try adjusting your filters to see more results'
                : 'Set up email forwarding to start receiving load offers automatically'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loads.map((load) => (
            <Card
              key={load.id}
              className="hover:border-gray-700 transition-all cursor-pointer group"
              onClick={() => setSelectedLoad(load)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Source icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    load.sourceType === 'EMAIL'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : load.sourceType === 'PHONE'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {getSourceIcon(load.sourceType)}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {load.subject || load.senderCompany || 'Untitled Load'}
                      </h3>
                      {getStatusBadge(load.status)}
                    </div>

                    <p className="text-sm text-gray-400 mb-2">
                      {load.senderName || load.senderEmail || load.senderPhone || 'Unknown sender'}
                      <span className="text-gray-600 mx-2">•</span>
                      {formatRelativeTime(load.receivedAt)}
                    </p>

                    {/* Extracted info */}
                    {load.extractedFields && (
                      <div className="flex flex-wrap gap-3 text-xs">
                        {load.extractedFields.pickup?.location && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-3 h-3" />
                            From: {load.extractedFields.pickup.location}
                          </span>
                        )}
                        {load.extractedFields.dropoff?.location && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-3 h-3" />
                            To: {load.extractedFields.dropoff.location}
                          </span>
                        )}
                        {load.extractedFields.rate?.amount && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(load.extractedFields.rate.amount)}
                          </span>
                        )}
                        {load.extractedFields.equipment && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Truck className="w-3 h-3" />
                            {load.extractedFields.equipment}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick actions / Status info */}
                  <div className="flex items-center gap-2">
                    {load.status === 'NEW' ? (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoad(load);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoad(load);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load detail modal */}
      {selectedLoad && (
        <LoadDetailModal
          load={selectedLoad}
          onClose={() => setSelectedLoad(null)}
          onAction={fetchLoads}
        />
      )}
    </div>
  );
}
