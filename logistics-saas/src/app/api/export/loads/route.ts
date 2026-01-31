import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/export/loads - Export load offers to CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasMinRole(user.role, 'DISPATCHER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build where clause
    const where: Record<string, unknown> = {
      companyId: user.companyId,
    };

    if (startDate) {
      where.receivedAt = { ...((where.receivedAt as object) || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.receivedAt = { ...((where.receivedAt as object) || {}), lte: new Date(endDate) };
    }
    if (status) {
      where.status = status;
    }

    const loads = await prisma.loadOffer.findMany({
      where,
      include: {
        decidedBy: { select: { name: true } },
        assignedDriver: { select: { name: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'ID',
      'Status',
      'Source',
      'Received At',
      'Sender Name',
      'Sender Email',
      'Sender Phone',
      'Subject',
      'Pickup Location',
      'Dropoff Location',
      'Rate',
      'Equipment',
      'Reference #',
      'Decided By',
      'Decision Date',
      'Assigned Driver',
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = loads.map((load: any) => {
      const extracted = load.extractedFields as Record<string, unknown> || {};
      const pickup = extracted.pickup as { location?: string } || {};
      const dropoff = extracted.dropoff as { location?: string } || {};
      const rate = extracted.rate as { amount?: number } || {};

      return [
        load.id,
        load.status,
        load.sourceType,
        formatDateTime(load.receivedAt),
        load.senderName || '',
        load.senderEmail || '',
        load.senderPhone || '',
        load.subject || '',
        pickup.location || '',
        dropoff.location || '',
        rate.amount ? `$${rate.amount}` : '',
        (extracted.equipment as string) || '',
        (extracted.referenceNumber as string) || '',
        load.decidedBy?.name || '',
        load.decisionAt ? formatDateTime(load.decisionAt) : '',
        load.assignedDriver?.name || '',
      ];
    });

    // Escape CSV values
    const escapeCSV = (val: string | number) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.join(','),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...rows.map((row: any) => row.map(escapeCSV).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="loads-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting loads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export loads' },
      { status: 500 }
    );
  }
}
