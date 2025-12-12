import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const template = await prisma.recurringTemplate.update({
      where: { id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        nextScheduled: body.nextScheduled ? new Date(body.nextScheduled) : undefined,
        lastGenerated: body.lastGenerated ? new Date(body.lastGenerated) : undefined,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Recurring template update error:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.recurringTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recurring template deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring template' },
      { status: 500 }
    );
  }
}
