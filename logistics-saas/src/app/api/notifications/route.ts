import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Query params schema
const querySchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'VOICE']).optional(),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED']).optional(),
  loadOfferId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { channel, status, loadOfferId, page = '1', limit = '50' } = parsed.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      companyId: session.user.companyId,
    };

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    if (loadOfferId) {
      where.loadOfferId = loadOfferId;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          loadOffer: {
            select: {
              id: true,
              subject: true,
              senderName: true,
              sourceType: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.notification.groupBy({
      by: ['status'],
      where: { companyId: session.user.companyId },
      _count: { id: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statsMap = stats.reduce((acc: Record<string, number>, s: any) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      notifications,
      stats: {
        pending: statsMap['PENDING'] || 0,
        sent: statsMap['SENT'] || 0,
        delivered: statsMap['DELIVERED'] || 0,
        failed: statsMap['FAILED'] || 0,
      },
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification
const createSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'VOICE']),
  toAddress: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  loadOfferId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
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

    const { channel, toAddress, subject, body: messageBody, loadOfferId, payload } = parsed.data;

    // Verify load offer belongs to company if provided
    if (loadOfferId) {
      const loadOffer = await prisma.loadOffer.findFirst({
        where: { id: loadOfferId, companyId: session.user.companyId },
      });

      if (!loadOffer) {
        return NextResponse.json({ error: 'Load offer not found' }, { status: 404 });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        companyId: session.user.companyId,
        loadOfferId,
        channel,
        toAddress,
        subject,
        body: messageBody,
        payload: payload || {},
        status: 'PENDING',
      },
    });

    // In production, this would trigger the actual sending via a queue/background job
    // For now, we'll simulate by updating status after creation
    // await sendNotification(notification);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
