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

    console.log('Fetching comments for postId:', postId); // Debug log

    // Get top-level comments (parentId is null)
    const topLevelComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          name: user.name,
          avatar: user.image,
        },
      })
      .from(comments)
      .leftJoin(user, eq(comments.authorId, user.id))
      .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));

    console.log('Found top-level comments:', topLevelComments.length); // Debug log

    // Get all replies for these comments
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            author: {
              name: user.name,
              avatar: user.image,
            },
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
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const { content, parentId } = await request.json(); // parentId for replies
    const userId = session.user.id;

    console.log('Creating comment for postId:', postId, 'parentId:', parentId); // Debug log

    const commentId = nanoid();

    const [newComment] = await db
      .insert(comments)
      .values({
        id: commentId,
        postId,
        authorId: userId,
        content,
        parentId: parentId || null, // null for top-level comments, parentId for replies
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Get the author info for the response
    const [commentWithAuthor] = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          name: user.name,
          avatar: user.image,
        },
      })
      .from(comments)
      .leftJoin(user, eq(comments.authorId, user.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    const responseData = {
      ...commentWithAuthor,
      date: commentWithAuthor.createdAt?.toISOString() || new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    console.log('Created comment:', responseData); // Debug log

    return Response.json(responseData);
  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}