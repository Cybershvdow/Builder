import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// GET /api/drivers - List drivers
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Drivers can only see themselves
    if (user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: {
          companyId: user.companyId,
          userId: user.id,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: driver ? [driver] : [],
      });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      companyId: user.companyId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { truckId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        gpsSessions: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

// POST /api/drivers - Create a driver
const createDriverSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  truckId: z.string().optional(),
  licenseNumber: z.string().optional(),
  createUserAccount: z.boolean().optional(),
  userPassword: z.string().min(8).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasMinRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createDriverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { createUserAccount, userPassword, ...driverData } = parsed.data;

    // Create driver (and optionally user account) in transaction
    const driver = await prisma.$transaction(async (tx: any) => {
      let userId: string | undefined;

      if (createUserAccount && driverData.email && userPassword) {
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(userPassword, 12);

        // Check if user already exists
        const existingUser = await tx.user.findUnique({
          where: { email: driverData.email },
        });

        if (existingUser) {
          throw new Error('A user with this email already exists');
        }

        const newUser = await tx.user.create({
          data: {
            companyId: user.companyId,
            email: driverData.email,
            name: driverData.name,
            passwordHash,
            role: 'DRIVER',
          },
        });
        userId = newUser.id;
      }

      const newDriver = await tx.driver.create({
        data: {
          companyId: user.companyId,
          userId,
          ...driverData,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          action: 'DRIVER_ADDED',
          entityType: 'Driver',
          entityId: newDriver.id,
          metadata: {
            driverName: driverData.name,
            hasUserAccount: !!userId,
          },
        },
      });

      return newDriver;
    });

    return NextResponse.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    const message = error instanceof Error ? error.message : 'Failed to create driver';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
