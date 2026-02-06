'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Globe,
  Shield,
  Bell,
  Archive,
  CheckCircle,
  Save,
} from 'lucide-react';

// Toast-like notification
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <Alert variant="success" className="shadow-lg min-w-[300px]">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}

export default function SettingsPage() {
  const [toast, setToast] = useState<string | null>(null);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Clinical Portal 2.0',
    defaultHospital: '',
    timezone: 'Africa/Harare',
  });

  // Authentication Settings
  const [authSettings, setAuthSettings] = useState({
    sessionTimeout: '30',
    passwordPolicy: 'strong',
    maxLoginAttempts: '5',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: 'enabled',
    smsNotifications: 'disabled',
  });

  // Audit Settings
  const [auditSettings, setAuditSettings] = useState({
    dataRetentionPeriod: '365',
    autoArchive: 'enabled',
  });

  const handleSave = (section: string) => {
    setToast(`${section} settings saved`);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic system configuration and defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  value={generalSettings.systemName}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({ ...prev, systemName: e.target.value }))
                  }
                  placeholder="Clinical Portal 2.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultHospital">Default Hospital</Label>
                <Input
                  id="defaultHospital"
                  value={generalSettings.defaultHospital}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({ ...prev, defaultHospital: e.target.value }))
                  }
                  placeholder="e.g., Harare Central Hospital"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={generalSettings.timezone}
                  onValueChange={(v) =>
                    setGeneralSettings((prev) => ({ ...prev, timezone: v }))
                  }
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Harare">Africa/Harare (CAT, UTC+2)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST, UTC+2)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('General')}>
                <Save className="mr-2 h-4 w-4" />
                Save General Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Authentication
          </CardTitle>
          <CardDescription>
            Configure login security and password policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={authSettings.sessionTimeout}
                  onChange={(e) =>
                    setAuthSettings((prev) => ({ ...prev, sessionTimeout: e.target.value }))
                  }
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Time in minutes before an inactive session expires
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <Select
                  value={authSettings.passwordPolicy}
                  onValueChange={(v) =>
                    setAuthSettings((prev) => ({ ...prev, passwordPolicy: v }))
                  }
                >
                  <SelectTrigger id="passwordPolicy">
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (min 6 characters)</SelectItem>
                    <SelectItem value="moderate">Moderate (min 8, mixed case)</SelectItem>
                    <SelectItem value="strong">Strong (min 10, mixed case, numbers, symbols)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Minimum password requirements for user accounts
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={authSettings.maxLoginAttempts}
                  onChange={(e) =>
                    setAuthSettings((prev) => ({ ...prev, maxLoginAttempts: e.target.value }))
                  }
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">
                  Account locks after this many failed attempts
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('Authentication')}>
                <Save className="mr-2 h-4 w-4" />
                Save Authentication Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure system notification channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <Select
                  value={notificationSettings.emailNotifications}
                  onValueChange={(v) =>
                    setNotificationSettings((prev) => ({ ...prev, emailNotifications: v }))
                  }
                >
                  <SelectTrigger id="emailNotifications">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Send email notifications for system events, alerts, and reminders
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <Select
                  value={notificationSettings.smsNotifications}
                  onValueChange={(v) =>
                    setNotificationSettings((prev) => ({ ...prev, smsNotifications: v }))
                  }
                >
                  <SelectTrigger id="smsNotifications">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Send SMS notifications for critical alerts and appointment reminders
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('Notification')}>
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Audit
          </CardTitle>
          <CardDescription>
            Configure data retention and archiving policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                <Select
                  value={auditSettings.dataRetentionPeriod}
                  onValueChange={(v) =>
                    setAuditSettings((prev) => ({ ...prev, dataRetentionPeriod: v }))
                  }
                >
                  <SelectTrigger id="dataRetention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 days (3 months)</SelectItem>
                    <SelectItem value="180">180 days (6 months)</SelectItem>
                    <SelectItem value="365">365 days (1 year)</SelectItem>
                    <SelectItem value="730">730 days (2 years)</SelectItem>
                    <SelectItem value="1825">1825 days (5 years)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How long audit log entries are kept before automatic deletion
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="autoArchive">Auto-Archive</Label>
                <Select
                  value={auditSettings.autoArchive}
                  onValueChange={(v) =>
                    setAuditSettings((prev) => ({ ...prev, autoArchive: v }))
                  }
                >
                  <SelectTrigger id="autoArchive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically archive old records beyond the retention period
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('Audit')}>
                <Save className="mr-2 h-4 w-4" />
                Save Audit Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Notice */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Settings changes are saved locally for display purposes. Backend persistence for system settings will be available in a future update.
        </AlertDescription>
      </Alert>
    </div>
  );
}
