import { auth } from '@server/lib/auth'; 
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return Response.json({ user: null });
    }

    return Response.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return Response.json({ user: null });
  }
}