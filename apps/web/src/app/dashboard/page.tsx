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

const SessionDebugger = () => {
  const { data: session, isPending, error } = authClient.useSession();
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 p-4 rounded-lg shadow-lg z-50 max-w-lg max-h-96 overflow-auto text-xs">
      <h3 className="font-bold mb-2 text-sm">🔍 Session Debug Panel</h3>
      <div className="space-y-3">
        <div className="p-2 bg-blue-50 rounded">
          <h4 className="font-semibold text-blue-800 mb-1">Session Status</h4>
          <div className="space-y-1">
            <p><strong>isPending:</strong> <span className={isPending ? 'text-orange-600' : 'text-green-600'}>{isPending ? 'true' : 'false'}</span></p>
            <p><strong>hasSession:</strong> <span className={session ? 'text-green-600' : 'text-red-600'}>{session ? 'true' : 'false'}</span></p>
            <p><strong>hasUser:</strong> <span className={session?.user ? 'text-green-600' : 'text-red-600'}>{session?.user ? 'true' : 'false'}</span></p>
            {error && <p className="text-red-600"><strong>Error:</strong> {error.message}</p>}
          </div>
        </div>

        {session?.user && (
          <div className="p-2 bg-green-50 rounded">
            <h4 className="font-semibold text-green-800 mb-1">User Info</h4>
            <div className="space-y-1">
              <p><strong>ID:</strong> {session.user.id || 'null'}</p>
              <p><strong>Email:</strong> {session.user.email || 'null'}</p>
              <p><strong>Name:</strong> {session.user.name || 'null'}</p>
              <p><strong>Image:</strong> {session.user.image ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        <div className="p-2 bg-gray-50 rounded">
          <h4 className="font-semibold text-gray-800 mb-1">Full Session</h4>
          <pre className="whitespace-pre-wrap break-all text-xs bg-white p-2 rounded border max-h-20 overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="p-2 bg-yellow-50 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Cookies</h4>
          <pre className="whitespace-pre-wrap break-all text-xs bg-white p-2 rounded border max-h-16 overflow-auto">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/auth/session', {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              const sessionData = await response.json();
              console.log('🔍 Manual session check:', {
                status: response.status,
                ok: response.ok,
                data: sessionData
              });
            } catch (error) {
              console.error('❌ Manual session check failed:', error);
            }
          }}
          className="w-full p-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Check Session Manually
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { getCategoryColor, getCategoryLabel } = useCategories();

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
      console.log('🔄 Starting dashboard data fetch...');
      console.log('📊 Session Hook Values:', {
        isPending,
        hasSession: !!session,
        sessionKeys: session ? Object.keys(session) : null,
        sessionData: session
      });

      if (session) {
        console.log('👤 Session User Data:', {
          hasUser: !!session.user,
          userId: session.user?.id,
          userEmail: session.user?.email,
          userName: session.user?.name,
          userKeys: session.user ? Object.keys(session.user) : null,
          fullUser: session.user
        });
      }

      if (isPending) {
        console.log('⏳ Session is still pending, waiting...');
        return;
      }

      if (!session?.user) {
        console.log('❌ No session or user found');
        console.log('🔍 Detailed session check:', {
          session,
          hasSession: !!session,
          user: session?.user,
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
        setError('No authenticated user found');
        setLoading(false);
        return;
      }

      try {
        const userId = session.user.id;
        console.log('✅ Found userId:', userId);
        
        if (!userId) {
          console.error('❌ No userId found in session');
          console.log('🔍 Session user object:', session.user);
          setError('User ID not found in session');
          setLoading(false);
          return;
        }

        const mockPosts = [
          {
            id: '1',
            title: 'My First Blog Post',
            category: 'General',
            status: 'Published' as const,
            date: new Date().toISOString(),
            views: 42,
            comments: 3,
            likes: 7,
            published: true,
          },
          {
            id: '2', 
            title: 'Draft Post',
            category: 'Technology',
            status: 'Draft' as const,
            date: new Date(Date.now() - 86400000).toISOString(),
            views: 0,
            comments: 0,
            likes: 0,
            published: false,
          }
        ];

        const mockActivities = [
          {
            id: 'activity-1',
            type: 'comment' as const,
            message: 'New comment on your post',
            postTitle: 'My First Blog Post',
            author: 'John Doe',
            date: new Date().toISOString(),
            isRead: false,
          }
        ];

        setPosts(mockPosts);
        setActivities(mockActivities);
        console.log('✅ Mock data loaded successfully for userId:', userId);

      } catch (error) {
        console.error('💥 Error with mock data:', error);
        setError(`Dashboard error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    console.log('🎯 useEffect triggered with dependencies:', { 
      sessionExists: !!session, 
      isPending,
      timestamp: new Date().toISOString()
    });

    if (!isPending) {
      fetchDashboardData();
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
          <p className="mt-2 text-xs text-slate-500">isPending: {isPending ? 'true' : 'false'}</p>
          <p className="text-xs text-slate-500">loading: {loading ? 'true' : 'false'}</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
              <p className="text-red-600 text-sm">Error: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <SessionDebugger />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h2>
          <p className="text-slate-600 mb-4">Please sign in to access your dashboard.</p>
          <p className="text-xs text-slate-500 mb-4">Debug: Session exists: {session ? 'true' : 'false'}, User exists: {session?.user ? 'true' : 'false'}</p>
          <Link href="/sign-in">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <SessionDebugger />
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <PenTool className="h-8 w-8 text-indigo-600" />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Narrativ
              </span>
            </Link>
            
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

          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t" ref={mobileMenuRef}>
              <div className="flex flex-col space-y-2 pt-4">
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Error: {error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome, {session.user.name}
          </h1>
          <p className="text-slate-600">Manage your blog posts and track your performance</p>
          <p className="text-xs text-slate-400 mt-1">Debug: UserID: {session.user.id}</p>
        </div>

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

          <div className="space-y-4 md:space-y-6">
            <CategoryStats posts={posts} />

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