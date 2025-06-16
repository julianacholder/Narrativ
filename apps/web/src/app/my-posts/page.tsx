'use client';

import React, { useState, useEffect } from "react";
import { Eye, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

// Import your centralized category system
import { CategoryBadge } from "@/components/ui/category-badge";

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
  createdAt: string;
  updatedAt: string;
  views?: number;
}

const CATEGORIES = [
  { value: "all", label: "All Posts" },
  { value: "tech", label: "Technology" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "work", label: "Work" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "personal", label: "Personal" }
];

export default function MyBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user?.id) {
      loadMyPosts();
    }
  }, [session]);

  useEffect(() => {
    if (selectedCategory === "all") {
      // Show only published posts for the blog view
      setFilteredPosts(posts.filter(post => post.published));
    } else {
      setFilteredPosts(posts.filter(post => post.category === selectedCategory && post.published));
    }
  }, [posts, selectedCategory]);

  const loadMyPosts = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      // Load only the current user's posts
      const response = await fetch(`/api/users/posts?userId=${session.user.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const featuredPost = filteredPosts[0]; // Most recent published post
  const regularPosts = filteredPosts.slice(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <div className="animate-pulse">
            <div className="h-12 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto mb-12"></div>
            <div className="h-80 bg-slate-200 rounded-xl mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Header with Back Arrow */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className=" flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              My Blog
            </h1>
            <p className="text-slate-600">
              Thoughts, insights, and stories from my journey
            </p>
          </div>
        </div>

        {/* Featured Post - Most Recent */}
        {featuredPost && (
          <div className="mb-12">
            <Card className="overflow-hidden shadow-lg bg-white/90 backdrop-blur-sm">
              <div className="relative">
                <Badge className="absolute top-4 left-4 z-10 bg-slate-900 text-white">
                  Featured
                </Badge>
                {featuredPost.image ? (
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-64 md:h-90 object-cover"
                      />
                    </div>
                    <div className="md:w-1/2 p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <CategoryBadge category={featuredPost.category} />
                        <span className="text-slate-500 text-sm">
                          {formatDate(featuredPost.createdAt)}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                        {featuredPost.title}
                      </h2>
                      <p className="text-slate-600 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          {featuredPost.views || 0} views
                        </span>
                        <span>{featuredPost.readTime}</span>
                      </div>
                      <Link href={`/post/${featuredPost.id}`}>
                        <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl">
                          Read More
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <CategoryBadge category={featuredPost.category} />
                      <span className="text-slate-500 text-sm">
                        📅 {formatDate(featuredPost.createdAt)}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                      {featuredPost.title}
                    </h2>
                    <p className="text-slate-600 mb-6">{featuredPost.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        {featuredPost.views || 0} views
                      </span>
                      <span>{featuredPost.readTime}</span>
                    </div>
                    <Link href={`/post/${featuredPost.id}`}>
                      <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className={`rounded-full ${
                selectedCategory === category.value 
                  ? "bg-slate-900 text-white" 
                  : "hover:bg-slate-100"
              }`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Posts Grid - Remaining posts in card format */}
        {regularPosts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden">
                {post.image && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CategoryBadge category={post.category} />
                    <span className="text-slate-500 text-xs">
                       {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-lg">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {post.views || 0}
                    </span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link href={`/post/${post.id}`}>
                    <Button variant="outline" className="w-full rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      Read More →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <Eye className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              {selectedCategory === "all" ? "No published posts yet" : `No posts in ${CATEGORIES.find(c => c.value === selectedCategory)?.label}`}
            </h3>
            <p className="text-slate-500 mb-4">
              {selectedCategory === "all" 
                ? "Publish some posts to see them here" 
                : "Try selecting a different category"
              }
            </p>
            <Link href="/dashboard">
              <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}