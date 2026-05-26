import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { createLeadAndAssign } from '@/services/lead-service';
import { leadCreateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = leadCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid lead payload.',
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const result = await createLeadAndAssign(parsed.data);

    return NextResponse.json(
      {
        message: result.assigned ? 'Lead saved and assigned to 3 providers.' : 'Lead saved but allocation failed.',
        lead: result.lead,
        assignments: result.assignments,
        allocationError: result.allocationError ?? null
      },
      { status: result.assigned ? 201 : 409 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'A lead with the same phone already exists for this service.'
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
