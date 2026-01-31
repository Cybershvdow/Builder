import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const toggleSchema = z.object({
  enabled: z.boolean(),
});

// POST /api/gps/toggle - Enable or disable GPS tracking
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
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { enabled } = parsed.data;

    if (enabled) {
      // Start a new GPS session
      const session = await prisma.gpsSession.create({
        data: {
          companyId: user.companyId,
          driverId: driver.id,
          isActive: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          action: 'GPS_ENABLED',
          entityType: 'GpsSession',
          entityId: session.id,
          metadata: {
            driverId: driver.id,
            driverName: driver.name,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: { sessionId: session.id, isActive: true },
        message: 'GPS tracking enabled',
      });
    } else {
      // End the current active session
      const activeSession = await prisma.gpsSession.findFirst({
        where: {
          driverId: driver.id,
          isActive: true,
        },
        include: {
          points: {
            orderBy: { recordedAt: 'asc' },
          },
        },
      });

      if (activeSession) {
        // Calculate total miles
        let totalMiles = 0;
        const points = activeSession.points;
        for (let i = 1; i < points.length; i++) {
          totalMiles += calculateDistance(
            points[i - 1].latitude,
            points[i - 1].longitude,
            points[i].latitude,
            points[i].longitude
          );
        }

        // Update session
        await prisma.gpsSession.update({
          where: { id: activeSession.id },
          data: {
            isActive: false,
            endedAt: new Date(),
            totalMiles,
          },
        });

        // Create mileage log entry
        if (totalMiles > 0) {
          await prisma.mileageLog.create({
            data: {
              companyId: user.companyId,
              driverId: driver.id,
              date: new Date(),
              miles: totalMiles,
              source: 'GPS',
              notes: `Session ${activeSession.id}`,
            },
          });
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            companyId: user.companyId,
            userId: user.id,
            action: 'GPS_DISABLED',
            entityType: 'GpsSession',
            entityId: activeSession.id,
            metadata: {
              driverId: driver.id,
              driverName: driver.name,
              totalMiles,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: { isActive: false },
        message: 'GPS tracking disabled',
      });
    }
  } catch (error) {
    console.error('Error toggling GPS:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle GPS' },
      { status: 500 }
    );
  }
}
