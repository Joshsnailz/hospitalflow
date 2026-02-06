'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auditApi, type AuditLog, type AuditStatistics, type AuditLogFilter } from '@/lib/api/audit';
import {
  Loader2,
  ScrollText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Shield,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'READ', label: 'Read' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'PASSWORD_CHANGE', label: 'Password Change' },
  { value: 'ROLE_CHANGE', label: 'Role Change' },
  { value: 'ACCESS_DENIED', label: 'Access Denied' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILURE', label: 'Failure' },
  { value: 'PARTIAL', label: 'Partial' },
];

const RESOURCE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'patient', label: 'Patient' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'encounter', label: 'Encounter' },
  { value: 'discharge_form', label: 'Discharge Form' },
  { value: 'clinical_note', label: 'Clinical Note' },
  { value: 'imaging_request', label: 'Imaging Request' },
  { value: 'controlled_drug_entry', label: 'Controlled Drug' },
  { value: 'emergency_visit', label: 'Emergency Visit' },
  { value: 'care_plan', label: 'Care Plan' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'department', label: 'Department' },
  { value: 'ward', label: 'Ward' },
  { value: 'bed', label: 'Bed' },
  { value: 'user', label: 'User' },
];

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'CREATE':
    case 'APPROVE':
      return 'default';
    case 'UPDATE':
    case 'PASSWORD_CHANGE':
    case 'ROLE_CHANGE':
      return 'secondary';
    case 'DELETE':
    case 'LOGIN_FAILED':
    case 'ACCESS_DENIED':
      return 'destructive';
    case 'READ':
    case 'LOGIN':
    case 'LOGOUT':
    case 'EXPORT':
      return 'outline';
    default:
      return 'outline';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case 'FAILURE':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case 'PARTIAL':
      return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    default:
      return null;
  }
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\./g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatResource(resource: string | null): string {
  if (!resource) return '-';
  return resource
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

function buildDescription(log: AuditLog): string {
  const parts: string[] = [];
  const user = log.userEmail || log.userId || 'System';
  const resource = formatResource(log.resource);
  const action = log.action.toLowerCase().replace(/_/g, ' ');

  if (log.description) return log.description;

  parts.push(`${user} performed ${action}`);
  if (log.resource) parts[0] = `${user} - ${action} on ${resource}`;
  if (log.resourceId) parts[0] += ` (${log.resourceId.substring(0, 8)}...)`;
  if (log.serviceName) parts.push(`via ${log.serviceName}`);

  return parts.join(' ');
}

export default function AuditTrailsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const filters: AuditLogFilter = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      if (searchQuery) filters.userEmail = searchQuery;
      if (actionFilter) filters.action = actionFilter;
      if (statusFilter) filters.status = statusFilter;
      if (resourceFilter) filters.resource = resourceFilter;
      if (dateFrom) filters.startDate = dateFrom;
      if (dateTo) filters.endDate = dateTo;

      const response = await auditApi.getLogs(filters);
      if (response.success && response.data) {
        setLogs(response.data.data || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, actionFilter, statusFilter, resourceFilter, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const response = await auditApi.getStatistics(dateFrom || undefined, dateTo || undefined);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch {
      // Stats are optional - don't show error
    } finally {
      setIsStatsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, statusFilter, resourceFilter, dateFrom, dateTo, itemsPerPage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trails</h1>
          <p className="text-muted-foreground">
            Comprehensive audit log for all user actions and system events
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => { fetchLogs(); fetchStats(); }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audit Logs</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '...' : (stats?.totalAuditLogs ?? total).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">System-wide events recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '...' : (stats?.uniqueUsersCount ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active users with audit trails</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Access Logs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '...' : (stats?.totalDataAccessLogs ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">PHI access events tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Access</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '...' : (stats?.emergencyAccessCount ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Break-glass access events</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Breakdown */}
      {stats?.logsByAction && Object.keys(stats.logsByAction).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actions Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.logsByAction)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([action, count]) => (
                  <div
                    key={action}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Badge variant={getActionBadgeVariant(action)} className="text-xs">
                      {action}
                    </Badge>
                    <span className="font-semibold">{(count as number).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Search by Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resource</Label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[155px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[155px]"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setActionFilter('');
                setStatusFilter('');
                setResourceFilter('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Audit Log Entries
          </CardTitle>
          <CardDescription>
            {total.toLocaleString()} total entr{total === 1 ? 'y' : 'ies'}
            {(searchQuery || actionFilter || statusFilter || resourceFilter || dateFrom || dateTo) && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground max-w-md">
                {error
                  ? 'Failed to load audit data. The audit service may be starting up. Try refreshing.'
                  : (searchQuery || actionFilter || statusFilter || resourceFilter || dateFrom || dateTo)
                  ? 'No entries match the current filters. Try adjusting your search criteria.'
                  : 'No audit log entries have been recorded yet. Actions will appear here as users interact with the system.'}
              </p>
              {error && (
                <Button variant="outline" onClick={fetchLogs} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[170px]">Timestamp</TableHead>
                      <TableHead className="w-[180px]">User</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                      <TableHead className="w-[120px]">Resource</TableHead>
                      <TableHead className="w-[70px]">Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[90px]">Service</TableHead>
                      <TableHead className="w-[120px]">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="truncate max-w-[170px]" title={log.userEmail || log.userId || 'System'}>
                            {log.userEmail || (log.userId ? log.userId.substring(0, 8) + '...' : 'System')}
                          </div>
                          {log.userRole && (
                            <div className="text-xs text-muted-foreground">{log.userRole}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                            {formatAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatResource(log.resource)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(log.status)}
                            <span className="text-xs">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[250px] truncate" title={buildDescription(log)}>
                          {buildDescription(log)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.serviceName || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => setItemsPerPage(Number(v))}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((opt) => (
                        <SelectItem key={opt} value={String(opt)}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>
                    Page {currentPage} of {totalPages} ({total.toLocaleString()} total)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
