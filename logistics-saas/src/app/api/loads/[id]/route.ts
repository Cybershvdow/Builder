import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// GET /api/loads/[id] - Get a single load offer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const load = await prisma.loadOffer.findFirst({
      where: {
        id,
        companyId: user.companyId, // Tenant isolation
      },
      include: {
        decidedBy: {
          select: { id: true, name: true, email: true },
        },
        assignedDriver: {
          select: { id: true, name: true, phone: true, truckId: true },
        },
        tags: {
          include: { tag: true },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: 'Load not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: load,
    });
  } catch (error) {
    console.error('Error fetching load:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch load' },
      { status: 500 }
    );
  }
}

// PATCH /api/loads/[id] - Update a load offer
const updateLoadSchema = z.object({
  assignedDriverId: z.string().nullable().optional(),
  extractedFields: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasMinRole(user.role, 'DISPATCHER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateLoadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify load belongs to company
    const existingLoad = await prisma.loadOffer.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existingLoad) {
      return NextResponse.json(
        { success: false, error: 'Load not found' },
        { status: 404 }
      );
    }

    const { tags, ...updateData } = parsed.data;

    // Update load and tags in transaction
    const load = await prisma.$transaction(async (tx) => {
      // Update load
      const updated = await tx.loadOffer.update({
        where: { id },
        data: updateData,
      });

      // Update tags if provided
      if (tags !== undefined) {
        // Remove existing tags
        await tx.loadOfferTag.deleteMany({
          where: { loadOfferId: id },
        });

        // Add new tags
        if (tags.length > 0) {
          await tx.loadOfferTag.createMany({
            data: tags.map((tagId) => ({
              loadOfferId: id,
              tagId,
            })),
          });
        }
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: load,
    });
  } catch (error) {
    console.error('Error updating load:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update load' },
      { status: 500 }
    );
  }
}

// DELETE /api/loads/[id] - Delete a load offer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasMinRole(user.role, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify load belongs to company
    const load = await prisma.loadOffer.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: 'Load not found' },
        { status: 404 }
      );
    }

    await prisma.loadOffer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Load deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting load:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete load' },
      { status: 500 }
    );
  }
}
