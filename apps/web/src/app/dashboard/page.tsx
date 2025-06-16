'use client';

import { useState, useEffect } from "react";
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
  Settings,
  LogOut,
  User,
  ChevronDown,
  Heart,
  MessageCircle,
  Globe,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface Post {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft'; // This is computed from the published field
  date: string;
  views: number;
  comments: number;
  likes: number;
  published?: boolean; // Add the actual database field
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

import { toast } from "sonner"; // Import toast from sonner directly

const Dashboard = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Updated fetchDashboardData function with dynamic userId
  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user) {
        console.log('❌ No session or user in frontend');
        return;
      }
      
      console.log('🔍 Frontend session:', {
        hasSession: !!session,
        userId: session.user?.id,
        userEmail: session.user?.email
      });
      
      try {
        // Get userId from session
        const userId = session.user.id;
        
        if (!userId) {
          console.error('❌ No userId found in session');
          setLoading(false);
          return;
        }
        
        console.log('📡 Making request to /api/users/posts with userId:', userId);
        
        // Fetch user's posts with userId parameter
        const postsResponse = await fetch(`/api/users/posts?userId=${userId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📥 Posts response:', {
          status: postsResponse.status,
          ok: postsResponse.ok,
          headers: Object.fromEntries(postsResponse.headers.entries())
        });

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          console.log('✅ Posts data received:', postsData);
          setPosts(postsData);
        } else {
          const errorText = await postsResponse.text();
          console.error('❌ Failed to fetch posts:', {
            status: postsResponse.status,
            statusText: postsResponse.statusText,
            error: errorText
          });
          toast.error('Failed to load posts', {
            description: 'Please refresh the page or try again'
          });
        }

        console.log('📡 Making request to /api/users/activities with userId:', userId);
        
        // Fetch recent activities with userId parameter
        const activitiesResponse = await fetch(`/api/users/activities?userId=${userId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('📥 Activities response:', {
          status: activitiesResponse.status,
          ok: activitiesResponse.ok
        });
        
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          console.log('✅ Activities data received:', activitiesData);
          setActivities(activitiesData);
        } else {
          const errorText = await activitiesResponse.text();
          console.error('❌ Failed to fetch activities:', {
            status: activitiesResponse.status,
            statusText: activitiesResponse.statusText,
            error: errorText
          });
        }

      } catch (error) {
        console.error('💥 Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      const loadingToast = toast.loading('Signing out...');
      
      await authClient.signOut();
      
      toast.dismiss(loadingToast);
      toast.success('Signed out successfully');
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out', {
        description: 'Please try again'
      });
    }
  };

  const handleDeletePost = async (postId: string): Promise<void> => {
    // Show confirmation toast with action buttons
    toast('Are you sure you want to delete this post?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const userId = session?.user?.id;
            
            if (!userId) {
              toast.error('Authentication error', {
                description: 'Please sign in again'
              });
              return;
            }

            // Show loading toast
            const loadingToast = toast.loading('Deleting post...', {
              description: 'Please wait while we delete your post'
            });

            console.log('🗑️ Deleting post:', postId);
            
            const response = await fetch(`/api/posts/${postId}/delete?userId=${userId}`, {
              method: 'DELETE',
              credentials: 'include',
            });

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete post');
            }

            // Remove the post from the local state
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            
            // Show success toast
            toast.success('Post deleted successfully', {
              description: 'Your post has been permanently deleted'
            });
            
            console.log('✅ Post deleted successfully');
            
          } catch (error) {
            console.error('❌ Error deleting post:', error);
            toast.error('Failed to delete post', {
              description: 'Please try again or contact support if the problem persists'
            });
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          toast.dismiss();
        },
      },
    });
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

  const categoryStats = posts.reduce((acc, post) => {
    const existing = acc.find(item => item.category === post.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ category: post.category, count: 1 });
    }
    return acc;
  }, [] as { category: string; count: number; }[]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Tech": "bg-blue-100 text-blue-800",
      "Work": "bg-green-100 text-green-800",
      "Lifestyle": "bg-purple-100 text-purple-800",
      "Travel": "bg-orange-100 text-orange-800",
      "Food": "bg-red-100 text-red-800",
      "Personal": "bg-pink-100 text-pink-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

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
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <PenTool className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Narrativ
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="hover:text-indigo-600">
                <Globe className="h-4 w-4 mr-2" />
                View Public Blog
              </Button>
            </Link>
            <Link href="/my-posts">
              <Button variant="ghost" className="hover:text-indigo-600">
                <FileText className="h-4 w-4 mr-2" />
                My Posts
              </Button>
            </Link>
            <Link href="/create-post">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                New Post
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
                  <Link href="/profile">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  </Link>
                  <Link href="/settings">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
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
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome, {session.user.name}
          </h1>
          <p className="text-slate-600">Manage your blog posts and track your performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Posts */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recent Posts</CardTitle>
                  <CardDescription>Manage your blog posts</CardDescription>
                </div>
                <Link href="/create-post">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.length > 0 ? posts.slice(0, 5).map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-slate-50 to-indigo-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-2">{post.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <Badge 
                              variant={post.status === 'Published' ? 'default' : 'secondary'}
                              className={post.status === 'Published' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {post.status}
                            </Badge>
                            <Badge className={getCategoryColor(post.category)}>
                              {post.category}
                            </Badge>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(post.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {post.views}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {post.likes}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/edit-post?id=${post.id}`}>
                            <Button variant="ghost" size="sm" className="hover:text-indigo-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="hover:text-green-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:text-red-600"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No posts yet</h3>
                      <p className="text-slate-500 mb-4">Create your first blog post to get started</p>
                      <Link href="/create-post">
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
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Comments, likes, and notifications on your posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length > 0 ? activities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg ${activity.isRead ? 'bg-slate-50' : 'bg-indigo-50'}`}>
                      <div className="flex-shrink-0">
                        {activity.type === 'comment' && <MessageCircle className="h-5 w-5 text-blue-600" />}
                        {activity.type === 'like' && <Heart className="h-5 w-5 text-red-600" />}
                        {activity.type === 'post' && <BookOpen className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">
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
                      <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">No activity yet</h3>
                      <p className="text-slate-500">Activity will appear here when people interact with your posts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Posts by Category</CardTitle>
                <CardDescription>Distribution of your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryStats.length > 0 ? categoryStats.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Badge variant="secondary" className={getCategoryColor(category.category)}>
                        {category.category}
                      </Badge>
                      <span className="text-sm font-medium">{category.count} posts</span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-4">No categories yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/create-post">
                  <Button variant="outline" className="w-full justify-start hover:bg-indigo-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start hover:bg-green-50">
                    <Globe className="h-4 w-4 mr-2" />
                    View Public Blog
                  </Button>
                </Link>
                <Link href="/my-posts">
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage All Posts
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full justify-start hover:bg-yellow-50">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
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