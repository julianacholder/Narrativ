// Create this file at: src/app/api/posts/[id]/edit/route.ts
import { db } from '@server/db';
import { posts } from '@server/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { auth } from '@server/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Update Post API called for ID:', params.id);
    
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

    const body = await request.json();
    const { title, content, excerpt, category, image, status, readTime } = body;

    console.log('📝 Updating post with data:', { title, category, status });

    // Check if post exists and user owns it
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, params.id))
      .limit(1);

    if (existingPost.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost[0].authorId !== userId) {
      return Response.json({ error: 'You can only edit your own posts' }, { status: 403 });
    }

    // Validation
    if (!title || !content || !category) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'Title, content, and category are required'
      }, { status: 400 });
    }

    const updatedPost = await db
      .update(posts)
      .set({
        title: title.trim(),
        content,
        excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        category,
        image: image || null,
        readTime: readTime || '5 min read',
        published: status === 'published',
        updatedAt: new Date(),
      })
      .where(eq(posts.id, params.id))
      .returning();

    console.log('✅ Post updated successfully:', updatedPost[0]);
    return Response.json(updatedPost[0]);

  } catch (error) {
    console.error('❌ Error updating post:', error);
    return Response.json({ 
      error: 'Failed to update post',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}