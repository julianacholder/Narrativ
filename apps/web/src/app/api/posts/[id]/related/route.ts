import { db } from '@/lib/db';
import { posts, user } from '@/lib/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    // First get the current post's category
    const [currentPost] = await db
      .select({ category: posts.category })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!currentPost) {
      return Response.json([]);
    }

    // Get related posts from same category
    const relatedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        excerpt: posts.excerpt,
        category: posts.category,
        image: posts.image,
        readTime: posts.readTime,
        createdAt: posts.createdAt,
        author: user.name,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(
        and(
          eq(posts.category, currentPost.category),
          ne(posts.id, postId),
          eq(posts.published, true)
        )
      )
      .limit(3);

    const relatedData = relatedPosts.map(post => ({
      ...post,
      date: post.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return Response.json(relatedData);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return Response.json({ error: 'Failed to fetch related posts' }, { status: 500 });
  }
}