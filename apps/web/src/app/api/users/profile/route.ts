// File: /api/users/profile/route.ts

import { db } from '@server/db';
import { user } from '@server/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    // Get userId from URL parameters (consistent with your other endpoints)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'UserId parameter required' }, { status: 400 });
    }

    const profileData = await request.json();
    
    console.log('🔄 Updating profile for user:', userId);

    // Validate required fields
    if (!profileData.name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!profileData.email?.trim()) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is already taken by another user
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, profileData.email))
      .limit(1);

    if (existingUser && existingUser.id !== userId) {
      return Response.json({ error: 'Email is already taken' }, { status: 409 });
    }

    // Update user profile in database
    const [updatedUser] = await db
      .update(user)
      .set({
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        
        image: profileData.image || null,
     
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        
        image: user.image,
       
      });

    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Profile updated successfully for user:', userId);

    return Response.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
    
  } catch (error) {
    console.error('💥 Error updating profile:', error);
    return Response.json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get userId from URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'UserId parameter required' }, { status: 400 });
    }

    // Fetch user profile
    const [userProfile] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userProfile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(userProfile);
    
  } catch (error) {
    console.error('💥 Error fetching profile:', error);
    return Response.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}