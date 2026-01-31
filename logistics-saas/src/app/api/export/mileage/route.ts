import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/export/mileage - Export mileage logs to CSV (for taxes)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const driverId = searchParams.get('driverId');

    // Build where clause with tenant isolation
    const where: Record<string, unknown> = {
      companyId: user.companyId,
    };

    // Drivers can only export their own mileage
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: { companyId: user.companyId, userId: user.id },
      });
      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Driver profile not found' },
          { status: 404 }
        );
      }
      where.driverId = driver.id;
    } else if (driverId) {
      where.driverId = driverId;
    }

    if (startDate) {
      where.date = { ...((where.date as object) || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...((where.date as object) || {}), lte: new Date(endDate) };
    }

    const logs = await prisma.mileageLog.findMany({
      where,
      include: {
        driver: { select: { name: true, truckId: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalMiles = logs.reduce((sum: number, log: any) => sum + log.miles, 0);

    // Generate CSV
    const headers = [
      'Date',
      'Driver',
      'Truck ID',
      'Miles',
      'Source',
      'Start Odometer',
      'End Odometer',
      'Notes',
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = logs.map((log: any) => [
      formatDate(log.date),
      log.driver.name,
      log.driver.truckId || '',
      log.miles.toFixed(1),
      log.source,
      log.startOdometer?.toFixed(0) || '',
      log.endOdometer?.toFixed(0) || '',
      log.notes || '',
    ]);

    // Add total row
    rows.push([]);
    rows.push(['TOTAL', '', '', totalMiles.toFixed(1), '', '', '', '']);

    // Add IRS mileage rate info (2026 rate - assumed)
    const irsRate = 0.70; // $0.70 per mile estimated for 2026
    const deduction = totalMiles * irsRate;
    rows.push([]);
    rows.push(['IRS Standard Mileage Rate (2026)', '', '', `$${irsRate.toFixed(2)}/mile`, '', '', '', '']);
    rows.push(['Estimated Tax Deduction', '', '', `$${deduction.toFixed(2)}`, '', '', '', '']);

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
        'Content-Disposition': `attachment; filename="mileage-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting mileage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export mileage' },
      { status: 500 }
    );
  }
}
