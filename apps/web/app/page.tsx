import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Clock,
  Users,
  Activity,
  Lock,
  FileCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">Clinical Portal 2.0</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 transition">
                Features
              </Link>
              <Link href="#security" className="text-slate-600 hover:text-slate-900 transition">
                Security
              </Link>
              <Link href="#about" className="text-slate-600 hover:text-slate-900 transition">
                About
              </Link>
            </div>
            <Link href="/login">
              <Button>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
                HIPAA & GDPR Compliant
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Modern Healthcare
              <span className="text-blue-600"> Management</span> Made Simple
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Streamline your clinical workflows with our comprehensive, secure, and compliant
              portal. From patient registration to discharge, we&apos;ve got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                Learn More
              </Button>
            </div>
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-slate-600">ISO 27001 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-slate-600">99.9% Uptime SLA</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-2xl flex items-center justify-center">
              <Activity className="h-48 w-48 text-white opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent rounded-2xl" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Active Users</p>
                  <p className="text-2xl font-bold text-blue-600">10,000+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Modern Healthcare
            </h2>
            <p className="text-lg text-slate-600">
              Comprehensive features designed for healthcare professionals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100"
              >
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Enterprise-Grade Security & Compliance
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Your data security is our top priority. We implement industry-leading security
                measures and comply with all major healthcare regulations.
              </p>
              <div className="space-y-4">
                {securityFeatures.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {complianceBadges.map((badge, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center"
                >
                  <div className="bg-blue-100 p-4 rounded-full mb-4">{badge.icon}</div>
                  <h4 className="font-bold text-slate-900">{badge.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{badge.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals using Clinical Portal 2.0
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-base">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold text-white">Clinical Portal 2.0</span>
              </div>
              <p className="text-slate-400 mb-4">
                Modern, secure, and compliant healthcare management platform.
              </p>
              <p className="text-sm text-slate-500">© 2026 Clinical Portal. All rights reserved.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <Users className="h-6 w-6 text-blue-600" />,
    title: 'Patient Management',
    description:
      'Comprehensive patient records, demographics, and medical history at your fingertips.',
  },
  {
    icon: <Clock className="h-6 w-6 text-blue-600" />,
    title: 'Appointment Scheduling',
    description:
      'Streamlined scheduling system with real-time availability and automated reminders.',
  },
  {
    icon: <FileCheck className="h-6 w-6 text-blue-600" />,
    title: 'Clinical Documentation',
    description: 'Efficient EMR/EHR documentation with templates and voice-to-text support.',
  },
  {
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    title: 'Role-Based Access',
    description: 'Granular permissions and role management ensuring data access control.',
  },
  {
    icon: <Activity className="h-6 w-6 text-blue-600" />,
    title: 'Real-Time Monitoring',
    description: 'Live dashboards and analytics for informed decision-making.',
  },
  {
    icon: <Lock className="h-6 w-6 text-blue-600" />,
    title: 'Audit Trail',
    description: 'Complete audit logs for compliance and security tracking.',
  },
];

const securityFeatures = [
  {
    title: 'End-to-End Encryption',
    description: 'All data encrypted at rest and in transit using AES-256.',
  },
  {
    title: 'HIPAA Compliance',
    description: 'Full compliance with HIPAA regulations for healthcare data protection.',
  },
  {
    title: 'GDPR Ready',
    description: 'Built-in features for data privacy, consent, and the right to be forgotten.',
  },
  {
    title: 'Automated Backups',
    description: 'Daily automated backups with point-in-time recovery.',
  },
];

const complianceBadges = [
  {
    icon: <Shield className="h-8 w-8 text-blue-600" />,
    title: 'HIPAA',
    subtitle: 'Compliant',
  },
  {
    icon: <Lock className="h-8 w-8 text-blue-600" />,
    title: 'GDPR',
    subtitle: 'Ready',
  },
  {
    icon: <FileCheck className="h-8 w-8 text-blue-600" />,
    title: 'ISO 27001',
    subtitle: 'Certified',
  },
  {
    icon: <Shield className="h-8 w-8 text-blue-600" />,
    title: 'SOC 2',
    subtitle: 'Type II',
  },
];
