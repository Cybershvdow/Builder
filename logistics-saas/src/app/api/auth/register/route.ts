import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { companyName, name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate unique slug for company
    let slug = slugify(companyName);
    let slugExists = await prisma.company.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${slugify(companyName)}-${counter}`;
      slugExists = await prisma.company.findUnique({ where: { slug } });
      counter++;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create company and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          plan: 'FREE',
        },
      });

      // Create user as OWNER
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email,
          name,
          passwordHash,
          role: 'OWNER',
        },
      });

      // Create default email integration placeholder
      const inboundAddress = `loads+${company.id}@inbound.freightflow.app`;
      await tx.emailIntegration.create({
        data: {
          companyId: company.id,
          provider: 'SENDGRID',
          inboundAddress,
          status: 'PENDING',
        },
      });

      return { company, user };
    });

    return NextResponse.json({
      success: true,
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug,
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
