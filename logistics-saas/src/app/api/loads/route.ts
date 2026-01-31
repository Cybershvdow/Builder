import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { LoadOfferStatus, LoadOfferSource } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// GET /api/loads - List load offers with filtering
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') as LoadOfferStatus | null;
    const sourceType = searchParams.get('sourceType') as LoadOfferSource | null;
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause with tenant isolation
    const where: Record<string, unknown> = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (sourceType) {
      where.sourceType = sourceType;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { senderEmail: { contains: search, mode: 'insensitive' } },
        { senderCompany: { contains: search, mode: 'insensitive' } },
        { bodyText: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate) {
      where.receivedAt = { ...((where.receivedAt as object) || {}), gte: new Date(startDate) };
    }

    if (endDate) {
      where.receivedAt = { ...((where.receivedAt as object) || {}), lte: new Date(endDate) };
    }

    const [loads, total] = await Promise.all([
      prisma.loadOffer.findMany({
        where,
        include: {
          decidedBy: {
            select: { id: true, name: true },
          },
          assignedDriver: {
            select: { id: true, name: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loadOffer.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: loads,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching loads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loads' },
      { status: 500 }
    );
  }
}

// POST /api/loads - Create a manual load offer
const createLoadSchema = z.object({
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional(),
  senderPhone: z.string().optional(),
  senderCompany: z.string().optional(),
  subject: z.string().optional(),
  bodyText: z.string().optional(),
  extractedFields: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasMinRole(user.role, 'DISPATCHER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createLoadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const load = await prisma.loadOffer.create({
      data: {
        companyId: user.companyId,
        sourceType: 'MANUAL',
        ...parsed.data,
        status: 'NEW',
      },
    });

    return NextResponse.json({
      success: true,
      data: load,
    });
  } catch (error) {
    console.error('Error creating load:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create load' },
      { status: 500 }
    );
  }
}
