import { db } from '@/lib/db';
import { posts, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        category: posts.category,
        image: posts.image,
        readTime: posts.readTime,
        createdAt: posts.createdAt,
        author: {
          name: user.name,
          avatar: user.image,
        },
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = {
      ...post,
      date: post.createdAt?.toISOString() || new Date().toISOString(),
      likes: 0, // Get from postLikes table
      isLiked: false, // Check if current user liked
    };

    return Response.json(postData);
  } catch (error) {
    console.error('Error fetching post:', error);
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}