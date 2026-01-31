import { getCurrentUser, hasMinRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['accept', 'deny']),
  notes: z.string().optional(),
  replyMessage: z.string().optional(),
  assignDriverId: z.string().optional(),
});

// POST /api/loads/[id]/action - Accept or deny a load
export async function POST(
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
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, notes, replyMessage, assignDriverId } = parsed.data;

    // Verify load belongs to company and is actionable
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

    if (load.status !== 'NEW' && load.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Load has already been processed' },
        { status: 400 }
      );
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'DENIED';

    // Update load and create notification in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update load status
      const updatedLoad = await tx.loadOffer.update({
        where: { id },
        data: {
          status: newStatus,
          decidedByUserId: user.id,
          decisionNotes: notes,
          decisionAt: new Date(),
          assignedDriverId: action === 'accept' ? assignDriverId : null,
        },
      });

      // Create notification record for reply
      const replyTo = load.senderEmail || load.senderPhone;
      if (replyTo) {
        const isEmail = replyTo.includes('@');
        const defaultReply = action === 'accept'
          ? `Thank you for your load offer${load.subject ? ` regarding "${load.subject}"` : ''}. We are pleased to confirm that we have accepted this load. Our team will be in touch shortly with pickup details.`
          : `Thank you for your load offer${load.subject ? ` regarding "${load.subject}"` : ''}. Unfortunately, we are unable to accept this load at this time. We appreciate your business and look forward to working with you in the future.`;

        const notification = await tx.notification.create({
          data: {
            companyId: user.companyId,
            loadOfferId: id,
            channel: isEmail ? 'EMAIL' : 'SMS',
            toAddress: replyTo,
            subject: action === 'accept'
              ? `Load Accepted: ${load.subject || 'Your Load Offer'}`
              : `Load Update: ${load.subject || 'Your Load Offer'}`,
            body: replyMessage || defaultReply,
            status: 'PENDING',
          },
        });

        // TODO: Actually send the email/SMS via SendGrid/Twilio
        // For now, we just mark it as sent
        await tx.notification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          action: action === 'accept' ? 'LOAD_ACCEPTED' : 'LOAD_DENIED',
          entityType: 'LoadOffer',
          entityId: id,
          metadata: {
            loadSubject: load.subject,
            senderEmail: load.senderEmail,
            senderPhone: load.senderPhone,
            notes,
          },
        },
      });

      return updatedLoad;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Load ${action === 'accept' ? 'accepted' : 'denied'} successfully`,
    });
  } catch (error) {
    console.error('Error processing load action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
