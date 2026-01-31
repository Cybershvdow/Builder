import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Query params schema
const querySchema = z.object({
  action: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// GET /api/audit-logs - List audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow OWNER and ADMIN to view audit logs
    if (!['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, userId, entityType, startDate, endDate, page = '1', limit = '50' } = parsed.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      companyId: session.user.companyId,
    };

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/audit-logs - Create an audit log entry (internal use)
const createSchema = z.object({
  action: z.enum([
    'LOGIN',
    'LOAD_ACCEPTED',
    'LOAD_DENIED',
    'INTEGRATION_ADDED',
    'INTEGRATION_UPDATED',
    'INTEGRATION_REMOVED',
    'GPS_ENABLED',
    'GPS_DISABLED',
    'USER_INVITED',
    'USER_REMOVED',
    'DRIVER_ADDED',
    'DRIVER_REMOVED',
    'SETTINGS_UPDATED',
  ]),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, entityType, entityId, metadata } = parsed.data;

    // Get IP and user agent from headers
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const log = await prisma.auditLog.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        action,
        entityType,
        entityId,
        metadata: metadata || {},
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
