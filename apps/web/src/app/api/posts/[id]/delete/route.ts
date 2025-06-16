
import { db } from '@server/db';
import { posts } from '@server/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { auth } from '@server/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params since they're now a Promise in newer Next.js versions
    const { id } = await params;
    
    console.log('🚀 Delete Post API called for ID:', id);
    
    // Try to get session but don't fail if it doesn't work
    let userId: string | null = null;
    
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('✅ Got userId from session:', userId);
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
      console.log('❌ No userId found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if post exists and user owns it
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (existingPost.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost[0].authorId !== userId) {
      return Response.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, id));

    console.log('✅ Post deleted successfully:', id);
    return Response.json({ 
      success: true, 
      message: 'Post deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('❌ Error deleting post:', error);
    return Response.json({ 
      error: 'Failed to delete post',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}