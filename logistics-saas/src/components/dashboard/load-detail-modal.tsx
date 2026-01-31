'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import {
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Truck,
  Calendar,
  User,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface ExtractedFields {
  pickup?: { location?: string; date?: string };
  dropoff?: { location?: string; date?: string };
  rate?: { amount?: number };
  equipment?: string;
  referenceNumber?: string;
  notes?: string;
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
  transcript?: string | null;
  extractedFields: ExtractedFields | null;
  status: string;
  receivedAt: string;
  decisionAt: string | null;
  decidedBy: { name: string } | null;
  assignedDriver: { name: string } | null;
}

interface LoadDetailModalProps {
  load: LoadOffer;
  onClose: () => void;
  onAction: () => void;
}

export function LoadDetailModal({ load, onClose, onAction }: LoadDetailModalProps) {
  const [action, setAction] = useState<'accept' | 'deny' | null>(null);
  const [notes, setNotes] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extracted = load.extractedFields || {};
  const isActionable = load.status === 'NEW' || load.status === 'PENDING';

  async function handleAction(actionType: 'accept' | 'deny') {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/loads/${load.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          notes,
          replyMessage: replyMessage || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onAction();
        onClose();
      } else {
        alert(data.error || 'Failed to process action');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Failed to process action');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'NEW':
        return <Badge variant="new">New</Badge>;
      case 'PENDING':
        return <Badge variant="pending">Pending</Badge>;
      case 'ACCEPTED':
        return <Badge variant="accepted">Accepted</Badge>;
      case 'DENIED':
        return <Badge variant="denied">Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              load.sourceType === 'EMAIL'
                ? 'bg-cyan-500/20 text-cyan-400'
                : load.sourceType === 'PHONE'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {load.sourceType === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {load.subject || 'Load Offer'}
                {getStatusBadge(load.status)}
              </DialogTitle>
              <DialogDescription>
                Received {formatDateTime(load.receivedAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sender Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Sender</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-white">{load.senderName || 'Unknown'}</span>
              </div>
              {load.senderCompany && (
                <p className="text-sm text-gray-400 ml-6">{load.senderCompany}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Contact</label>
              {load.senderEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${load.senderEmail}`} className="text-cyan-400 hover:underline text-sm">
                    {load.senderEmail}
                  </a>
                </div>
              )}
              {load.senderPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${load.senderPhone}`} className="text-cyan-400 hover:underline text-sm">
                    {load.senderPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Fields */}
          {(extracted.pickup?.location || extracted.dropoff?.location || extracted.rate?.amount) && (
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
              <h4 className="text-sm font-medium text-white">Extracted Load Details</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {extracted.pickup?.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="text-white">{extracted.pickup.location}</p>
                      {extracted.pickup.date && (
                        <p className="text-xs text-gray-400">{extracted.pickup.date}</p>
                      )}
                    </div>
                  </div>
                )}
                {extracted.dropoff?.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Delivery</p>
                      <p className="text-white">{extracted.dropoff.location}</p>
                      {extracted.dropoff.date && (
                        <p className="text-xs text-gray-400">{extracted.dropoff.date}</p>
                      )}
                    </div>
                  </div>
                )}
                {extracted.rate?.amount && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Rate</p>
                      <p className="text-white font-medium">{formatCurrency(extracted.rate.amount)}</p>
                    </div>
                  </div>
                )}
                {extracted.equipment && (
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Equipment</p>
                      <p className="text-white">{extracted.equipment}</p>
                    </div>
                  </div>
                )}
                {extracted.referenceNumber && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Reference</p>
                      <p className="text-white font-mono">{extracted.referenceNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Original Content */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              {load.sourceType === 'PHONE' ? 'Call Transcript' : 'Email Content'}
            </label>
            <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 max-h-48 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                {load.transcript || load.bodyText || 'No content available'}
              </pre>
            </div>
          </div>

          {/* Decision Info (if already decided) */}
          {load.decisionAt && (
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">
                  Decision made {formatDateTime(load.decisionAt)}
                </span>
              </div>
              {load.decidedBy && (
                <p className="text-sm text-gray-400">
                  By: {load.decidedBy.name}
                </p>
              )}
              {load.assignedDriver && (
                <p className="text-sm text-gray-400">
                  Assigned to: {load.assignedDriver.name}
                </p>
              )}
            </div>
          )}

          {/* Action Form */}
          {isActionable && !action && (
            <div className="flex gap-3">
              <Button
                variant="success"
                className="flex-1"
                onClick={() => setAction('accept')}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept Load
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setAction('deny')}
              >
                <X className="w-4 h-4 mr-2" />
                Deny Load
              </Button>
            </div>
          )}

          {/* Action confirmation */}
          {action && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <h4 className="font-medium text-white">
                {action === 'accept' ? 'Accept this load?' : 'Deny this load?'}
              </h4>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes for your team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply">Reply Message (optional)</Label>
                <Textarea
                  id="reply"
                  placeholder={action === 'accept'
                    ? "Thank you for your load offer. We're pleased to confirm..."
                    : "Thank you for your offer. Unfortunately, we're unable to..."
                  }
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Leave blank to use the default template
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant={action === 'accept' ? 'success' : 'destructive'}
                  className="flex-1"
                  onClick={() => handleAction(action)}
                  isLoading={isSubmitting}
                >
                  {action === 'accept' ? 'Confirm Accept' : 'Confirm Deny'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
