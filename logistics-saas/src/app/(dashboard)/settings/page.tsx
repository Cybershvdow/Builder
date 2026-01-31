'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Building2,
  Users,
  Mail,
  Phone,
  Key,
  CreditCard,
  Copy,
  Check,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your company settings and integrations</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">
            <Key className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <EmailIntegrationCard />
          <PhoneIntegrationCard />
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmailIntegrationCard() {
  const [copied, setCopied] = useState(false);
  const inboundEmail = 'loads+demo123@inbound.freightflow.app';

  function copyToClipboard() {
    navigator.clipboard.writeText(inboundEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Email Ingestion</CardTitle>
              <CardDescription>Automatically import load offers from email</CardDescription>
            </div>
          </div>
          <Badge variant="pending">Setup Required</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inbound Address */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-2">Your Inbound Email Address</h4>
          <p className="text-xs text-gray-500 mb-3">
            Forward load offer emails to this address to automatically import them into your dashboard.
          </p>
          <div className="flex gap-2">
            <Input
              value={inboundEmail}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">Setup Instructions</h4>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400 font-medium flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm text-white">Go to your email settings (Gmail, Outlook, etc.)</p>
                <p className="text-xs text-gray-500">Find the forwarding or rules section</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400 font-medium flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm text-white">Create a forwarding rule</p>
                <p className="text-xs text-gray-500">Forward emails from your load sources to the address above</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400 font-medium flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm text-white">Start receiving loads!</p>
                <p className="text-xs text-gray-500">Forwarded emails will appear in your Load Offers dashboard</p>
              </div>
            </div>
          </div>
        </div>

        {/* SMTP for Replies */}
        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200">Reply emails require SMTP configuration</p>
              <p className="text-xs text-amber-300/70 mt-1">
                To send accept/deny reply emails, configure your SMTP settings or connect your email account.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Configure SMTP
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PhoneIntegrationCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Phone Receptionist</CardTitle>
              <CardDescription>Answer calls and collect load information automatically</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">Not Configured</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">
          Connect a Twilio phone number to enable AI-powered call handling. The AI assistant will answer calls, collect load details, and log them to your dashboard.
        </p>

        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Requirements</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              Twilio account with a phone number
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              OpenAI API key for AI conversations
            </li>
          </ul>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Connect Twilio
        </Button>
      </CardContent>
    </Card>
  );
}

function CompanySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Update your company details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" placeholder="Acme Trucking" defaultValue="Demo Trucking Co" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Company URL Slug</Label>
            <Input id="slug" placeholder="acme-trucking" defaultValue="demo-trucking" disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Business Address</Label>
          <Input id="address" placeholder="123 Main St, City, State 12345" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Business Phone</Label>
            <Input id="phone" type="tel" placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" placeholder="https://yourcompany.com" />
          </div>
        </div>

        <div className="pt-4">
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSettings() {
  const [showInvite, setShowInvite] = useState(false);

  const teamMembers = [
    { id: '1', name: 'John Owner', email: 'john@demo.com', role: 'OWNER', lastLogin: '2 hours ago' },
    { id: '2', name: 'Sarah Dispatcher', email: 'sarah@demo.com', role: 'DISPATCHER', lastLogin: '1 day ago' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage who has access to your account</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Last login: {member.lastLogin}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>Manage your subscription and payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-white">Free Plan</h4>
              <p className="text-sm text-gray-400">Basic features for small teams</p>
            </div>
            <Badge>Current Plan</Badge>
          </div>
          <ul className="space-y-2 text-sm text-gray-400 mb-4">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Up to 50 load offers per month
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              2 team members
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Email ingestion
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              GPS tracking
            </li>
          </ul>
          <Button>
            Upgrade to Pro
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Pro Plan Preview */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-white">Professional Plan</h4>
              <p className="text-sm text-gray-400">$49/month</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-500" />
              Unlimited load offers
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-500" />
              Unlimited team members
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-500" />
              AI phone receptionist
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-500" />
              Advanced analytics
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gray-500" />
              Priority support
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
