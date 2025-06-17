// Create this file at: src/app/api/posts/create/route.ts
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Create Post API called');
    
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

    console.log('📝 Creating post with data:', { title, category, status });

    // Validation
    if (!title || !content || !category) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'Title, content, and category are required'
      }, { status: 400 });
    }

    const postId = nanoid();
    
    const newPost = await db.insert(posts).values({
      id: postId,
      title: title.trim(),
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
      category,
      authorId: userId,
      image: image || null,
      readTime: readTime || '5 min read',
      published: status === 'published',
    }).returning();

    console.log('✅ Post created successfully:', newPost[0]);
    return Response.json(newPost[0]);

  } catch (error) {
    console.error('❌ Error creating post:', error);
    return Response.json({ 
      error: 'Failed to create post',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}