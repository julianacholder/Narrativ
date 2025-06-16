'use client';

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PenTool, 
  Plus, 
  BarChart3, 
  BookOpen, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye, 
  LogOut,
  User,
  ChevronDown,
  Heart,
  MessageCircle,
  Globe,
  FileText,
  Menu,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Import the new category system
import { useCategories } from "@/lib/categories";
import { CategoryBadge } from "@/components/ui/category-badge";
import { CategoryStats } from "@/components/ui/category-stats";

interface Post {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  date: string;
  views: number;
  comments: number;
  likes: number;
  published?: boolean;
}

interface Activity {
  id: string;
  type: 'comment' | 'like' | 'post';
  message: string;
  postTitle: string;
  author?: string;
  date: string;
  isRead: boolean;
}

const Dashboard = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Use the category hook
  const { getCategoryColor, getCategoryLabel } = useCategories();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user) {
        console.log('❌ No session or user in frontend');
        return;
      }
      
      try {
        const userId = session.user.id;
        console.log('🚀 Starting fetch for userId:', userId);
        
        if (!userId) {
          console.error('❌ No userId found in session');
          setLoading(false);
          return;
        }
        
        console.log('📡 Fetching posts...');
        const postsResponse = await fetch(`/api/users/posts?userId=${userId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📊 Posts response status:', postsResponse.status, postsResponse.statusText);

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          console.log('✅ Posts data received:', postsData.length, 'posts');
          setPosts(postsData);
        } else {
          const errorText = await postsResponse.text();
          console.error('❌ Failed to fetch posts:', postsResponse.status, errorText);
          toast.error('Failed to load posts');
        }

        console.log('📡 Fetching activities...');
        const activitiesResponse = await fetch(`/api/users/activities?userId=${userId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('🔔 Activities response status:', activitiesResponse.status, activitiesResponse.statusText);
        
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          console.log('✅ Activities data received:', activitiesData.length, 'activities');
          setActivities(activitiesData);
        } else {
          console.error('❌ Failed to fetch activities:', activitiesResponse.status);
        }

      } catch (error) {
        console.error('💥 Error fetching dashboard data:', error);
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    }

    if (session?.user) {
      console.log('✅ Session found, starting data fetch');
      fetchDashboardData();
    } else if (!isPending) {
      console.log('⏭️ No session and not pending, setting loading to false');
      setLoading(false);
    } else {
      console.log('⏳ Still pending...');
    }
  }, [session, isPending]);

  const handleSignOut = async () => {
    try {
      const loadingToast = toast.loading('Signing out...');
      await authClient.signOut();
      toast.dismiss(loadingToast);
      toast.success('Signed out successfully');
      setShowUserMenu(false);
      setShowMobileMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleDeletePost = async (postId: string): Promise<void> => {
    toast('Are you sure you want to delete this post?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const userId = session?.user?.id;
            
            if (!userId) {
              toast.error('Authentication error');
              return;
            }

            const loadingToast = toast.loading('Deleting post...');
            
            const response = await fetch(`/api/posts/${postId}/delete?userId=${userId}`, {
              method: 'DELETE',
              credentials: 'include',
            });

            toast.dismiss(loadingToast);

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete post');
            }

            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            toast.success('Post deleted successfully');
            
          } catch (error) {
            console.error('❌ Error deleting post:', error);
            toast.error('Failed to delete post');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss(),
      },
    });
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const stats = [
    { 
      label: "Total Posts", 
      value: posts.length.toString(), 
      icon: BookOpen, 
      color: "text-indigo-600" 
    },
    { 
      label: "Published", 
      value: posts.filter(p => p.status === 'Published').length.toString(), 
      icon: Eye, 
      color: "text-green-600" 
    },
    { 
      label: "Drafts", 
      value: posts.filter(p => p.status === 'Draft').length.toString(), 
      icon: Edit, 
      color: "text-yellow-600" 
    },
    { 
      label: "Total Views", 
      value: posts.reduce((acc, post) => acc + post.views, 0).toLocaleString(), 
      icon: BarChart3, 
      color: "text-purple-600" 
    }
  ];

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile-Responsive Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <PenTool className="h-8 w-8 text-indigo-600" />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Narrativ
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="hover:text-indigo-600">
                  <Globe className="h-4 w-4 mr-2" />
                  View Public Blog
                </Button>
              </Link>
              <Link href="/my-posts">
                <Button variant="ghost" className="hover:text-indigo-600">
                  <FileText className="h-4 w-4 mr-2" />
                  My Blog
                </Button>
              </Link>
              <Link href="/new-post">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </Link>
              
              {/* Desktop User Menu */}
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-indigo-50"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                    <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{session.user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                    </div>
                    <Link href="/profile">
                      <button 
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </Link>
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
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="hover:bg-indigo-50"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t" ref={mobileMenuRef}>
              <div className="flex flex-col space-y-2 pt-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                    <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                  </div>
                </div>

                <Link href="/new-post">
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 mb-2"
                    onClick={closeMobileMenu}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </Link>

                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:text-indigo-600"
                    onClick={closeMobileMenu}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View Public Blog
                  </Button>
                </Link>

                <Link href="/my-blog">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:text-indigo-600"
                    onClick={closeMobileMenu}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    My Blog
                  </Button>
                </Link>

                <Link href="/profile">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:text-indigo-600"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome, {session.user.name}
          </h1>
          <p className="text-slate-600">Manage your blog posts and track your performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs md:text-sm text-slate-600">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Recent Posts */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg md:text-xl">Recent Posts</CardTitle>
                  <CardDescription className="text-sm">Manage your blog posts</CardDescription>
                </div>
                <Link href="/new-post" className="hidden sm:block">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="space-y-3 md:space-y-4">
                  {posts.length > 0 ? posts.slice(0, 5).map((post) => (
                    <div key={post.id} className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-slate-50 to-indigo-50">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base line-clamp-2">{post.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-600">
                            <Badge 
                              variant={post.status === 'Published' ? 'default' : 'secondary'}
                              className={`text-xs ${post.status === 'Published' ? 'bg-green-100 text-green-800' : ''}`}
                            >
                              {post.status}
                            </Badge>
                            <CategoryBadge category={post.category} />
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              {new Date(post.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 md:gap-4 text-xs text-slate-500 mt-2">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {post.views}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {post.comments}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {post.likes}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                          <Link href={`/new-post?id=${post.id}`}>
                            <Button variant="ghost" size="sm" className="hover:text-indigo-600 h-8 w-8 md:h-9 md:w-9 p-0">
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </Link>
                          <Link href={`/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="hover:text-green-600 h-8 w-8 md:h-9 md:w-9 p-0">
                              <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:text-red-600 h-8 w-8 md:h-9 md:w-9 p-0"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-semibold text-slate-600 mb-2">No posts yet</h3>
                      <p className="text-sm md:text-base text-slate-500 mb-4">Create your first blog post to get started</p>
                      <Link href="/new-post">
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Post
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-sm">Comments, likes, and notifications on your posts</CardDescription>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="space-y-3 md:space-y-4">
                  {activities.length > 0 ? activities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg ${activity.isRead ? 'bg-slate-50' : 'bg-indigo-50'}`}>
                      <div className="flex-shrink-0">
                        {activity.type === 'comment' && <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />}
                        {activity.type === 'like' && <Heart className="h-4 w-4 md:h-5 md:w-5 text-red-600" />}
                        {activity.type === 'post' && <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-slate-800">
                          {activity.message}
                          <span className="font-medium"> "{activity.postTitle}"</span>
                          {activity.author && <span className="text-slate-600"> by {activity.author}</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                        </p>
                      </div>
                      {!activity.isRead && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 md:h-16 md:w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-semibold text-slate-600 mb-2">No activity yet</h3>
                      <p className="text-sm md:text-base text-slate-500">Activity will appear here when people interact with your posts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Using the CategoryStats component */}
            <CategoryStats posts={posts} />

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription className="text-sm">Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/new-post">
                  <Button variant="outline" className="w-full justify-start hover:bg-indigo-50 text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start hover:bg-green-50 text-sm">
                    <Globe className="h-4 w-4 mr-2" />
                    View Public Blog
                  </Button>
                </Link>
                <Link href="/my-posts">
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50 text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    My Blog
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;