import { db } from '@server/db';
import { comments, user } from '@server/db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@server/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const topLevelComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: { name: user.name, avatar: user.image },
      })
      .from(comments)
      .leftJoin(user, eq(comments.authorId, user.id))
      .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));

    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            author: { name: user.name, avatar: user.image },
          })
          .from(comments)
          .leftJoin(user, eq(comments.authorId, user.id))
          .where(eq(comments.parentId, comment.id))
          .orderBy(desc(comments.createdAt));

        return {
          ...comment,
          date: comment.createdAt?.toISOString() || new Date().toISOString(),
          likes: 0,
          isLiked: false,
          replies: replies.map(reply => ({
            ...reply,
            date: reply.createdAt?.toISOString() || new Date().toISOString(),
            likes: 0,
            isLiked: false,
          })),
        };
      })
    );

    return Response.json(commentsWithReplies);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get userId from URL parameters (like your other endpoints)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    console.log('🔍 UserId from URL:', userId);
    
    if (!userId) {
      return Response.json({ error: 'UserId parameter required' }, { status: 400 });
    }

    // Optional: Still check session for additional security
    const session = await auth.api.getSession({ headers: request.headers });
    console.log('🔐 Session check:', { hasSession: !!session?.user, sessionUserId: session?.user?.id });
    
    // Verify the userId matches the session user (if session exists)
    if (session?.user?.id && session.user.id !== userId) {
      return Response.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    const { id: postId } = await params;
    const { content, parentId } = await request.json();
    
    if (!content?.trim()) {
      return Response.json({ error: 'Comment content required' }, { status: 400 });
    }

    const commentId = nanoid();

    await db.insert(comments).values({
      id: commentId,
      postId,
      authorId: userId, // Use the userId from URL parameter
      content: content.trim(),
      parentId: parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [commentWithAuthor] = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: { name: user.name, avatar: user.image },
      })
      .from(comments)
      .leftJoin(user, eq(comments.authorId, user.id))
      .where(eq(comments.id, commentId));

    return Response.json({
      ...commentWithAuthor,
      date: commentWithAuthor.createdAt?.toISOString() || new Date().toISOString(),
      likes: 0,
      isLiked: false,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}