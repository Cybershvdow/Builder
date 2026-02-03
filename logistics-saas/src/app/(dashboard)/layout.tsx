import { DashboardShell } from '@/components/dashboard/shell';

// Demo user for preview mode (no database required)
const demoUser = {
  id: 'demo-001',
  name: 'John Smith',
  email: 'john@acmetrucking.com',
  role: 'OWNER' as const,
  companyName: 'Acme Trucking Co',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In production, replace demoUser with session.user from auth()
  // const session = await auth();
  // if (!session?.user) { redirect('/login'); }

  return <DashboardShell user={demoUser}>{children}</DashboardShell>;
}
