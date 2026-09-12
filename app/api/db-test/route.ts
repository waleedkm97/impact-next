import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.staffUser.count();

    return Response.json({
      success: true,
      staffUsers: count,
    });
  } catch (error) {
    console.error('Database test failed:', error);

    return Response.json(
      {
        success: false,
        error: 'Database connection failed',
      },
      { status: 500 }
    );
  }
}