"use client";

import React, { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';

// Properly configure dynamic import for MDEditor
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 border border-slate-200 rounded-xl flex items-center justify-center">
      <div className="text-slate-500">Loading editor...</div>
    </div>
  )
});

// Types - Updated to match your database schema
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  authorId: string;
  image: string | null;
  readTime: string;
  published: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface FormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
  image: string;
}

interface Category {
  value: string;
  label: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { value: "tech", label: "Technology", color: "bg-blue-100 text-blue-800" },
  { value: "lifestyle", label: "Lifestyle", color: "bg-pink-100 text-pink-800" },
  { value: "work", label: "Work", color: "bg-purple-100 text-purple-800" },
  { value: "travel", label: "Travel", color: "bg-green-100 text-green-800" },
  { value: "food", label: "Food", color: "bg-orange-100 text-orange-800" },
  { value: "personal", label: "Personal", color: "bg-gray-100 text-gray-800" }
];

// Separate component to handle search params
function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    status: "draft",
    image: "",
  });

  const { data: session, isPending } = authClient.useSession();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const postId = searchParams.get('id');
    if (postId) {
      loadPost(postId);
    }
  }, [searchParams, isClient]);

  const loadPost = async (postId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const post: BlogPost = await response.json();
      
      if (post) {
        setEditingPost(post);
        setFormData({
          title: post.title || "",
          content: post.content || "",
          excerpt: post.excerpt || "",
          category: post.category || "",
          status: post.published ? 'published' : 'draft',
          image: post.image || "",
        });
      }
    } catch (error) {
      console.error("Error loading post:", error);
    }
  };

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (file: File): Promise<void> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const { file_url }: { file_url: string } = await response.json();
      setFormData(prev => ({ ...prev, image: file_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
    }
    setIsUploading(false);
  };

  const handleSave = async (status: 'draft' | 'published' = 'draft'): Promise<void> => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      alert('Please fill in all required fields (title, content, and category)');
      return;
    }

    if (!session?.user?.id) {
      alert('You must be logged in to save posts');
      return;
    }

    setIsLoading(true);
    try {
      const userId = session.user.id;
      
      const postData = {
        title: formData.title.trim(),
        content: formData.content,
        excerpt: formData.excerpt || formData.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        category: formData.category,
        image: formData.image || null,
        status,
        readTime: calculateReadTime(formData.content) + ' min read',
      };

      let response: Response;
      
      if (editingPost) {
        console.log('📝 Updating post:', editingPost.id);
        response = await fetch(`/api/posts/${editingPost.id}/edit?userId=${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(postData),
        });
      } else {
        console.log('📝 Creating new post');
        response = await fetch(`/api/posts/create?userId=${userId}`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save post');
      }

      const savedPost = await response.json();
      console.log('✅ Post saved successfully:', savedPost);

      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Error saving post:', error);
      alert('Failed to save post. Please try again.');
    }
    setIsLoading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Show loading state while session is loading or client is mounting
  if (!isClient || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {editingPost ? 'Edit Post' : 'Write New Post'}
              </h1>
              <p className="text-slate-600 mt-1">Share your thoughts with the world</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={isLoading}
              className="rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              <Eye className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200/60 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Post Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter your post title..."
                      className="text-xl font-semibold border-slate-200/60 focus:border-slate-400 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Content
                    </Label>
                    <div className="prose-editor">
                      <MDEditor
                        value={formData.content}
                        onChange={(value) => handleInputChange('content', value || '')}
                        height={400}
                        preview="edit"
                        hideToolbar={false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Excerpt
                  </Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Brief description of your post..."
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Featured Image</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.image ? (
                  <div className="space-y-4">
                    <img
                      src={formData.image}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="w-full rounded-xl"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-3">Upload a featured image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={isUploading}
                      className="rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function Editor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}