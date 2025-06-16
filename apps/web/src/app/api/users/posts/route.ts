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
    console.log('📋 Request method:', request.method);

    // Try to get session but don't fail if it doesn't work
    let userId: string | null = null;
    
    try {
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
      
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('✅ Got userId from session:', userId);
      } else {
        console.log('⚠️ Session exists but no user ID found');
      }
    } catch (sessionError) {
      console.log('⚠️ Session failed:', sessionError);
    }
    
    // If session failed, try to get userId from URL parameter as fallback
    if (!userId) {
      const url = new URL(request.url);
      userId = url.searchParams.get('userId');
      
      if (userId) {
        console.log('🔓 Using userId from URL parameter:', userId);
      }
    }

    if (!userId) {
      console.log('❌ No userId found in session or URL parameter');
      // Instead of failing, let's see what we have
      console.log('🔍 Available headers:', Object.fromEntries(request.headers.entries()));
      return Response.json({ 
        error: 'Unable to determine user ID',
        debug: {
          hasHeaders: !!request.headers,
          headerCount: request.headers ? Array.from(request.headers.keys()).length : 0,
          url: request.url
        }
      }, { status: 400 });
    }

    /* 
    // ORIGINAL AUTHENTICATION CODE - COMMENTED OUT FOR DEBUGGING
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
    */

    console.log('📊 Fetching posts from database for userId:', userId);
    
    // First, let's check if this user exists and has any posts at all
    const allPostsForUser = await db
      .select({ id: posts.id, title: posts.title, authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.authorId, userId));
    
    console.log('🔍 Debug - All posts for this user:', allPostsForUser);
    console.log('🔍 Debug - Total posts found:', allPostsForUser.length);
    
    if (allPostsForUser.length === 0) {
      console.log('⚠️ No posts found for userId:', userId);
      return Response.json([]);
    }

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
    console.log('🔍 First post example:', userPosts[0]);

    if (userPosts.length === 0) {
      console.log('⚠️ No posts returned from main query');
      return Response.json([]);
    }

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
    console.log('🔍 Sample post with stats:', postsWithStats[0]);
    
    const response = Response.json(postsWithStats);
    console.log('📤 Response status:', response.status);
    return response;

  } catch (error) {
    console.error('❌ Error in users posts API:', error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    return Response.json(
      { 
        error: 'Failed to fetch posts',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}