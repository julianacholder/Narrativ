// Real Posts API with Authentication and Database
import { db } from '@server/db';
import { posts, comments, postLikes } from '@server/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { auth } from '@server/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Users Posts API called');
    console.log('📋 Request URL:', request.url);
    console.log('📋 Request headers:', {
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
      'content-type': request.headers.get('content-type')
    });

    console.log('🔐 Attempting to get session...');
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log('🔍 Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : null
    });

    if (!session?.user?.id) {
      console.log('❌ Authentication failed - no session or user ID');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('✅ User authenticated:', userId);

    console.log('📊 Fetching posts from database...');
    // Get ALL user's posts (both published and drafts)
    const userPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        excerpt: posts.excerpt,
        category: posts.category,
        published: posts.published,
        createdAt: posts.createdAt,
        readTime: posts.readTime,
      })
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));

    console.log('📝 Found posts:', userPosts.length);

    // Get stats for each post
    console.log('📈 Calculating post statistics...');
    const postsWithStats = await Promise.all(
      userPosts.map(async (post) => {
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
          status: post.published ? 'Published' as const : 'Draft' as const,
          date: post.createdAt?.toISOString() || new Date().toISOString(),
          views: 0, // You can implement view tracking later
          comments: commentCount.count,
          likes: likeCount.count,
        };
      })
    );

    console.log('✅ Returning posts with stats:', postsWithStats.length);
    return Response.json(postsWithStats);

  } catch (error) {
    console.error('❌ Error in users posts API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}