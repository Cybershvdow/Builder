import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// GET /api/gps - Get active driver locations (for dispatchers/admins)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Drivers can only see their own location
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: {
          companyId: user.companyId,
          userId: user.id,
        },
      });

      if (!driver) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const session = await prisma.gpsSession.findFirst({
        where: {
          driverId: driver.id,
          isActive: true,
        },
        include: {
          points: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!session || session.points.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const point = session.points[0];
      return NextResponse.json({
        success: true,
        data: [{
          driverId: driver.id,
          driverName: driver.name,
          truckId: driver.truckId,
          position: {
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed,
            heading: point.heading,
            timestamp: point.recordedAt.getTime(),
          },
          isActive: true,
          sessionId: session.id,
        }],
      });
    }

    // Dispatchers and admins can see all active drivers
    const activeSessions = await prisma.gpsSession.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      include: {
        driver: true,
        points: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locations = activeSessions
      .filter((session: any) => session.points.length > 0)
      .map((session: any) => {
        const point = session.points[0];
        return {
          driverId: session.driverId,
          driverName: session.driver.name,
          truckId: session.driver.truckId,
          position: {
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed,
            heading: point.heading,
            timestamp: point.recordedAt.getTime(),
          },
          isActive: true,
          sessionId: session.id,
        };
      });

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching GPS locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/gps - Record a GPS point (for drivers)
const gpsPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  altitude: z.number().optional(),
  accuracy: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get driver for this user
    const driver = await prisma.driver.findFirst({
      where: {
        companyId: user.companyId,
        userId: user.id,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = gpsPointSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Find or create active session
    let session = await prisma.gpsSession.findFirst({
      where: {
        driverId: driver.id,
        isActive: true,
      },
    });

    if (!session) {
      session = await prisma.gpsSession.create({
        data: {
          companyId: user.companyId,
          driverId: driver.id,
          isActive: true,
        },
      });
    }

    // Create GPS point
    const point = await prisma.gpsPoint.create({
      data: {
        companyId: user.companyId,
        driverId: driver.id,
        sessionId: session.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({
      success: true,
      data: point,
    });
  } catch (error) {
    console.error('Error recording GPS point:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record location' },
      { status: 500 }
    );
  }
}
