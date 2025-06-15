import { db } from '@server/db';
import { postLikes } from '@server/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@server/lib/auth'; 

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if user is authenticated
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const userId = session.user.id;

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    if (existingLike) {
      // Unlike
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    } else {
      // Like - need to provide ID
      await db
        .insert(postLikes)
        .values({
          id: nanoid(),
          postId,
          userId,
          createdAt: new Date(),
        });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error toggling like:', error);
    return Response.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}