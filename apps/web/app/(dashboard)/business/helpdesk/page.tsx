'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  HelpCircle,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Server,
  Database,
  Globe,
  Shield,
  Activity,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account', label: 'Account / Access' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'training', label: 'Training / How-To' },
  { value: 'data', label: 'Data / Reports' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I reset my password?',
    answer:
      'Navigate to the login page and click "Forgot Password". Enter your registered email address and you will receive a password reset link. If you do not receive the email, contact IT Helpdesk directly.',
  },
  {
    question: 'How do I register a new patient?',
    answer:
      'Go to Patients > Add Patient from the left navigation menu. Fill in the required fields (first name, last name, date of birth, national ID) and click "Register Patient". The system will generate a unique CHI number automatically.',
  },
  {
    question: 'How do I schedule an appointment?',
    answer:
      'Open the patient record and navigate to the Appointments tab. Click "New Appointment", select the date, time, department, and doctor. The system can auto-assign a doctor based on availability if preferred.',
  },
  {
    question: 'What should I do if the system is slow or unresponsive?',
    answer:
      'First, try refreshing your browser (Ctrl+R or Cmd+R). If the issue persists, clear your browser cache and try again. If the problem continues, check the System Status section below. If all services show operational, please submit a support request with details about what you were doing when the issue occurred.',
  },
  {
    question: 'How do I access patient discharge forms?',
    answer:
      'Navigate to Discharge > Clinical Discharge from the left menu. You can view active discharge forms, create new ones, and track their status. Pharmacy review is accessible from Discharge > Pharmacy Review.',
  },
  {
    question: 'Who can access controlled drug records?',
    answer:
      'Controlled drug records are restricted to authorized personnel only, including pharmacists, doctors, and ward nurses with the appropriate role assignment. Contact your administrator if you need access.',
  },
  {
    question: 'How do I generate reports?',
    answer:
      'Reports can be accessed from the Business section in the navigation menu. Select the report type, configure the date range and filters, and click Generate. Reports can be exported in PDF or CSV format.',
  },
  {
    question: 'How do I update my profile or contact information?',
    answer:
      'Click on your avatar in the top-right corner and select "Profile". From there you can update your name, phone number, and notification preferences. Email changes require administrator approval.',
  },
];

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  icon: typeof Server;
}

const SYSTEM_SERVICES: SystemService[] = [
  { name: 'All Services', status: 'operational', icon: Activity },
  { name: 'Database', status: 'operational', icon: Database },
  { name: 'API Gateway', status: 'operational', icon: Globe },
  { name: 'Authentication', status: 'operational', icon: Shield },
  { name: 'File Storage', status: 'operational', icon: Server },
];

// Toast notification
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

// FAQ Item Component
function FaqItemComponent({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-50 transition-colors rounded-lg">
          <span className="text-sm font-medium pr-4">{item.question}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// System status badge
function StatusBadge({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  if (status === 'operational') {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Operational
      </Badge>
    );
  }
  if (status === 'degraded') {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
        Degraded
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      Outage
    </Badge>
  );
}

export default function HelpdeskPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Support form state
  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.category || !form.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    // Simulate a brief delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    setToast('Support request submitted');
    setForm({ subject: '', category: '', priority: 'medium', description: '' });
  };

  const isFormValid = form.subject.trim() && form.category && form.description.trim();

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Helpdesk</h1>
        <p className="text-muted-foreground">
          Get support, submit requests, and find answers to common questions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Request Form - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Submit Support Request
              </CardTitle>
              <CardDescription>
                Describe your issue or request and our team will respond as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, priority: v }))}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Please provide as much detail as possible about your issue or request. Include steps to reproduce, error messages, and any relevant context."
                    rows={6}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription>
                Reach our IT Helpdesk team directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">IT Helpdesk Phone</p>
                    <p className="text-sm text-muted-foreground">+263 242 700 000</p>
                    <p className="text-sm text-muted-foreground">Ext. 2001</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">helpdesk@clinicalportal.co.zw</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Support Hours</p>
                    <p className="text-sm text-muted-foreground">Monday - Friday: 07:00 - 18:00</p>
                    <p className="text-sm text-muted-foreground">Saturday: 08:00 - 13:00</p>
                    <p className="text-sm text-muted-foreground">Sunday &amp; Public Holidays: Closed</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Emergency support available 24/7 for critical issues
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                System Status
              </CardTitle>
              <CardDescription>Current status of system services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SYSTEM_SERVICES.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{service.name}</span>
                      </div>
                      <StatusBadge status={service.status} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Find quick answers to common questions about the Clinical Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {FAQ_ITEMS.map((item, index) => (
              <FaqItemComponent key={index} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
