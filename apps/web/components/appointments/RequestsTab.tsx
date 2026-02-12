'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { appointmentsApi } from '@/lib/api/appointments';
import { REQUEST_STATUS_BADGE_MAP } from '@/lib/constants/appointments';
import { formatDate } from '@/lib/utils/date-format';
import { DashboardStatsCards } from './DashboardStatsCards';
import { ResolveRequestDialog } from './ResolveRequestDialog';
import type { RescheduleRequest } from '@/lib/types/appointment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface RequestsTabProps {
  refreshKey: number;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function RequestsTab({ refreshKey, onRefresh, showToast }: RequestsTabProps) {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogResolution, setDialogResolution] = useState<'approved' | 'rejected'>('approved');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsApi.getRescheduleRequests();
      if (response.success) {
        setRequests(response.data);
      } else {
        setError('Failed to load requests');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  const openResolveDialog = (request: RescheduleRequest, resolution: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setDialogResolution(resolution);
    setDialogOpen(true);
  };

  const handleDialogSuccess = (message: string) => {
    showToast('success', message);
    fetchRequests();
    onRefresh();
  };

  const stats = useMemo(() => {
    const pendingRescheduleCount = requests.filter((r) => r.status === 'pending' && r.type !== 'cancel').length;
    const pendingCancelCount = requests.filter((r) => r.status === 'pending' && r.type === 'cancel').length;
    const approvedCount = requests.filter((r) => r.status === 'approved').length;
    const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

    return [
      { title: 'Pending Reschedules', value: pendingRescheduleCount, icon: AlertCircle, iconClassName: 'text-yellow-500' },
      { title: 'Pending Cancellations', value: pendingCancelCount, icon: XCircle, iconClassName: 'text-orange-500' },
      { title: 'Approved', value: approvedCount, icon: CheckCircle, iconClassName: 'text-emerald-500' },
      { title: 'Rejected', value: rejectedCount, icon: XCircle, iconClassName: 'text-red-500' },
    ];
  }, [requests]);

  const truncateId = (id: string) => (id?.length > 8 ? `${id.slice(0, 8)}...` : id || '-');

  return (
    <div className="space-y-6">
      <DashboardStatsCards items={stats} />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading requests...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchRequests}>
                Retry
              </Button>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium text-muted-foreground">No action requests</p>
              <p className="text-sm text-muted-foreground mt-1">
                There are no reschedule or cancellation requests to review at this time.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const statusInfo = REQUEST_STATUS_BADGE_MAP[req.status];
                  const isPending = req.status === 'pending';
                  const isCancel = req.type === 'cancel';

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs" title={req.appointmentId}>
                        {truncateId(req.appointmentId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isCancel ? 'destructive' : 'info'}>
                          {isCancel ? 'Cancel' : 'Reschedule'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{req.requestedByName}</span>
                          <span className="text-xs text-muted-foreground capitalize">{req.requestedByRole}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-2">{req.reason}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo?.variant || 'outline'}>{statusInfo?.label || req.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(req.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 px-2 text-emerald-600 hover:text-emerald-700 gap-1"
                              onClick={() => openResolveDialog(req, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">{isCancel ? 'Approve Cancel' : 'Approve'}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 px-2 text-red-600 hover:text-red-700 gap-1"
                              onClick={() => openResolveDialog(req, 'rejected')}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Reject</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {req.resolvedAt ? `Resolved ${formatDate(req.resolvedAt)}` : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ResolveRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        resolution={dialogResolution}
        onSuccess={handleDialogSuccess}
        onError={(msg) => showToast('error', msg)}
      />
    </div>
  );
}
