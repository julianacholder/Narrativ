import { db } from '@/lib/db';
import { posts, user, comments, postLikes } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get posts with author info, comment count, and like count
    const postsWithCounts = await db
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
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt));

    // Get comment and like counts for each post
    const postsWithStats = await Promise.all(
      postsWithCounts.map(async (post) => {
        // Get comment count
        const [commentCount] = await db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.postId, post.id));

        // Get like count
        const [likeCount] = await db
          .select({ count: count() })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

        return {
          ...post,
          comments: commentCount.count,
          likes: likeCount.count,
           date: post.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0], // Add null check
        };
      })
    );

    return Response.json(postsWithStats);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}