import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get load stats
    const [totalLoads, newLoads, acceptedLoads, deniedLoads] = await Promise.all([
      prisma.loadOffer.count({
        where: { companyId: user.companyId },
      }),
      prisma.loadOffer.count({
        where: { companyId: user.companyId, status: 'NEW' },
      }),
      prisma.loadOffer.count({
        where: {
          companyId: user.companyId,
          status: 'ACCEPTED',
          decisionAt: { gte: startOfMonth },
        },
      }),
      prisma.loadOffer.count({
        where: {
          companyId: user.companyId,
          status: 'DENIED',
          decisionAt: { gte: startOfMonth },
        },
      }),
    ]);

    // Get active drivers count
    const activeDrivers = await prisma.gpsSession.count({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
    });

    // Get total miles this month
    const mileageAgg = await prisma.mileageLog.aggregate({
      where: {
        companyId: user.companyId,
        date: { gte: startOfMonth },
      },
      _sum: { miles: true },
    });
    const totalMilesThisMonth = mileageAgg._sum.miles || 0;

    // Get recent loads for the activity feed
    const recentLoads = await prisma.loadOffer.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        status: true,
        sourceType: true,
        senderName: true,
        senderCompany: true,
        subject: true,
        receivedAt: true,
      },
      orderBy: { receivedAt: 'desc' },
      take: 5,
    });

    // Get loads by source
    const loadsBySource = await prisma.loadOffer.groupBy({
      by: ['sourceType'],
      where: {
        companyId: user.companyId,
        receivedAt: { gte: startOfMonth },
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalLoads,
          newLoads,
          acceptedLoads,
          deniedLoads,
          activeDrivers,
          totalMilesThisMonth,
        },
        recentLoads,
        loadsBySource: loadsBySource.map((s) => ({
          source: s.sourceType,
          count: s._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
