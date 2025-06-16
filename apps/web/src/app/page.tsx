'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PenTool, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  ArrowRight, 
  MessageCircle, 
  Heart, 
  BookOpen,
  Plus,
  LayoutDashboard,
  LogOut,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string | null;
  readTime: string | null;
  comments: number;
  likes: number;
  image: string | null;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get session data
  const { data: session, isPending } = authClient.useSession();

  // Fetch posts when component mounts
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const categories = [
    { name: "All", color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { name: "Tech", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { name: "Work", color: "bg-green-100 text-green-700 hover:bg-green-200" },
    { name: "Lifestyle", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    { name: "Travel", color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
    { name: "Food", color: "bg-red-100 text-red-700 hover:bg-red-200" },
    { name: "Personal", color: "bg-pink-100 text-pink-700 hover:bg-pink-200" }
  ];

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(cat => cat.name === category);
    return categoryData?.color || "bg-gray-100 text-gray-700";
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading amazing stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation - Conditional based on login status */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <PenTool className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Narrativ
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {session?.user ? (
              // Logged in user navigation
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="hover:text-indigo-600">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/new-post">
                  <Button variant="ghost" className="hover:text-indigo-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Write
                  </Button>
                </Link>
                
                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-indigo-50"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                      <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                        <p className="text-sm text-gray-500">{session.user.email}</p>
                      </div>
                      <Link href="/dashboard">
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </button>
                      </Link>
                      <Link href="/my-blog">
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <BookOpen className="h-4 w-4 mr-2" />
                          My Blog
                        </button>
                      </Link>
                      <Link href="/profile">
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </button>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Guest user navigation
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hover:text-indigo-600">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header with Hero Background */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl -z-10"></div>
          <div className="py-16 px-8">
            <h1 className="text-5xl leading-tight md:leading-relaxed font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Discover Amazing Stories
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Explore insights, experiences, and ideas from our community of passionate writers
            </p>
            <div className="flex items-center justify-center space-x-8 mt-8 text-slate-500">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>{posts.length} Stories</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>{posts.reduce((acc, post) => acc + post.comments, 0).toLocaleString()} Comments</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>{posts.reduce((acc, post) => acc + post.likes, 0)} Likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 space-y-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="Search amazing stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-2 border-slate-200 focus:border-indigo-500 rounded-xl shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  transition-all hover:scale-105 rounded-full px-6 py-2
                  ${selectedCategory === category.name 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                    : `${category.color} border-0`
                  }
                `}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm"
            >
              <Link href={`/post/${post.id}`}>
                {/* Image Header */}
                <div className="relative overflow-hidden">
                  <img 
                    src={post.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop'} 
                    alt={post.title}
                    className="w-full h-60 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <Badge 
                    className={`absolute top-4 left-4 ${getCategoryColor(post.category)} border-0 shadow-md`}
                  >
                    {post.category}
                  </Badge>
                </div>

                <CardHeader className="pb-4 pt-3">
                  <CardTitle className="group-hover:text-indigo-600 transition-colors leading-tight text-lg">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-slate-600">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{post.author || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime || '5 min read'}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredPosts.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-600 mb-2">No stories found</h3>
            <p className="text-slate-500">Try adjusting your search terms or explore different categories</p>
          </div>
        )}

        {/* Load More Button */}
        {filteredPosts.length > 0 && (
          <div className="text-center mt-16">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3 rounded-xl border-2 border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 transition-all"
            >
              Load More Stories
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <PenTool className="h-8 w-8 text-indigo-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Narrativ
            </span>
          </div>
          <p className="text-slate-400">&copy; 2024 Narrativ. Crafted with ❤️ for storytellers.</p>
        </div>
      </footer>
    </div>
  );
}