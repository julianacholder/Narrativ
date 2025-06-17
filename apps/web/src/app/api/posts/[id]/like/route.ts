import { db } from '@/lib/db';
import { postLikes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get userId from URL parameters (like your other endpoints)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'UserId parameter required' }, { status: 400 });
    }

    const { id: postId } = await params;

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      isLiked = false;
    } else {
      // Like
      await db
        .insert(postLikes)
        .values({
          id: nanoid(),
          postId,
          userId,
          createdAt: new Date(),
        });
      isLiked = true;
    }

    // Get total like count
    const totalLikes = await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    return Response.json({ 
      success: true, 
      isLiked,
      totalLikes: totalLikes.length 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return Response.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}