// Create this file at: src/app/api/users/activities/route.ts
import { db } from '@server/db';
import { comments, posts, postLikes, user } from '@server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { auth } from '@server/lib/auth';

// Define the Activity type
interface Activity {
  id: string;
  type: 'comment' | 'like' | 'post';
  message: string;
  postTitle: string;
  postId: string;
  author: string | null;
  date: string;
  isRead: boolean;
  metadata?: {
    commentContent?: string;
    authorAvatar?: string | null;
    likerAvatar?: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log(' Users Activities API called');
    console.log(' Request URL:', request.url);

    // Try to get session but don't fail if it doesn't work
    let userId: string | null = null;
    
    try {
      console.log(' Attempting to get session...');
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      console.log(' Session debug:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      });
      
      if (session?.user?.id) {
        userId = session.user.id;
        console.log(' Got userId from session:', userId);
      }
    } catch (sessionError) {
      console.log('Session failed:', sessionError);
    }
    
    // If session failed, try to get userId from URL parameter as fallback
    if (!userId) {
      const url = new URL(request.url);
      userId = url.searchParams.get('userId');
      
      if (userId) {
        console.log(' Using userId from URL parameter:', userId);
      }
    }

    if (!userId) {
      console.log(' No userId found in session or URL parameter');
      return Response.json({ 
        error: 'Unable to determine user ID',
        message: 'Please provide userId parameter or valid session'
      }, { status: 400 });
    }

    console.log(' Fetching activities from database for userId:', userId);
    const activities: Activity[] = []; //  Now properly typed

    // Get comments on user's posts
    console.log('Fetching comments on user posts...');
    const commentsOnMyPosts = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        postTitle: posts.title,
        postId: posts.id,
        authorName: user.name,
        authorAvatar: user.image,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .leftJoin(user, eq(comments.authorId, user.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(20);

    console.log(' Found comments:', commentsOnMyPosts.length);

    // Add comment activities
    commentsOnMyPosts.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        message: `New comment on your post`,
        postTitle: comment.postTitle,
        postId: comment.postId,
        author: comment.authorName,
        date: comment.createdAt?.toISOString() || new Date().toISOString(),
        isRead: false,
        metadata: {
          commentContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
          authorAvatar: comment.authorAvatar,
        }
      });
    });

    // Get likes on user's posts
    console.log('Fetching likes on user posts...');
    const likesOnMyPosts = await db
      .select({
        id: postLikes.id,
        createdAt: postLikes.createdAt,
        postTitle: posts.title,
        postId: posts.id,
        likerName: user.name,
        likerAvatar: user.image,
      })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .leftJoin(user, eq(postLikes.userId, user.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(postLikes.createdAt))
      .limit(20);

    console.log('Found likes:', likesOnMyPosts.length);

    // Add like activities
    likesOnMyPosts.forEach(like => {
      activities.push({
        id: `like-${like.id}`,
        type: 'like',
        message: `Someone liked your post`,
        postTitle: like.postTitle,
        postId: like.postId,
        author: like.likerName,
        date: like.createdAt?.toISOString() || new Date().toISOString(),
        isRead: false,
        metadata: {
          likerAvatar: like.likerAvatar,
        }
      });
    });

    // Get user's recent published posts
    console.log(' Fetching user recent posts...');
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.published, true)))
      .orderBy(desc(posts.createdAt))
      .limit(10);

    console.log(' Found recent posts:', recentPosts.length);

    // Add post publication activities
    recentPosts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: 'post',
        message: `You published a new post`,
        postTitle: post.title,
        postId: post.id,
        author: null,
        date: post.createdAt?.toISOString() || new Date().toISOString(),
        isRead: true,
        metadata: {}
      });
    });

    // Sort all activities by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('Returning activities:', activities.length);
    return Response.json(activities.slice(0, 20));

  } catch (error) {
    console.error('Error fetching user activities:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ 
      error: 'Failed to fetch activities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}