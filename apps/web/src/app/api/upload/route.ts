// Vercel Blob Upload API
// Create this file at: src/app/api/upload/route.ts

import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Vercel Blob Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      }, { status: 400 });
    }

    // Validate file size (4.5MB limit for Vercel Blob on free tier)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large',
        details: 'Maximum file size is 4.5MB'
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const filename = `blog-images/${timestamp}-${randomString}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public', // Make images publicly accessible
      contentType: file.type,
    });

    console.log('✅ File uploaded to Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      file_url: blob.url, // This is what goes in your database
      filename: filename,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Vercel Blob upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Delete from Vercel Blob
    const { del } = await import('@vercel/blob');
    await del(url);

    console.log('✅ File deleted from Vercel Blob:', url);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Vercel Blob delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}