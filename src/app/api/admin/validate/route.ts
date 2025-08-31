import {NextRequest, NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';

export async function GET(request: NextRequest) {
  const result = await validateAdminAccess();

  if (result.error) {
    return result.error;
  }

  return NextResponse.json({
    success: true,
    user: result.user,
  });
}
