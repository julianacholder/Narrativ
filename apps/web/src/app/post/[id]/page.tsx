'use client';

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  PenTool, 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2,
  Send,
  ThumbsUp,
  Reply,
  Plus,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  author: {
    name: string;
    avatar: string;
  };
  readTime: string;
  likes: number;
  isLiked: boolean;
  image: string;
  tags: string[];
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  date: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface RelatedPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
}

export default function PostPage() {
  const params = useParams();
  const postId = params.id;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get session data
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchPostData() {
      try {
        // Fetch post data
        const postResponse = await fetch(`/api/posts/${postId}`);
        if (!postResponse.ok) throw new Error('Failed to fetch post');
        const postData = await postResponse.json();
        setPost(postData);

        // Fetch comments
        const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
        const commentsData = await commentsResponse.json();
        setComments(commentsData);

        // Fetch related posts
        const relatedResponse = await fetch(`/api/posts/${postId}/related`);
        if (!relatedResponse.ok) throw new Error('Failed to fetch related posts');
        const relatedData = await relatedResponse.json();
        setRelatedPosts(relatedData);

      } catch (error) {
        console.error('Error fetching post data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      fetchPostData();
    }
  }, [postId]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setShowUserMenu(false);
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setPost(prev => prev ? {
          ...prev,
          likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
          isLiked: !prev.isLiked
        } : null);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...(comment.replies || []), newReply] }
            : comment
        ));
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleCommentLike = (commentId: string) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    // Handle comment like logic here
  };

  const handleReplyClick = (commentId: string) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setReplyingTo(commentId);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Tech": "bg-blue-100 text-blue-700",
      "Work": "bg-green-100 text-green-700",
      "Lifestyle": "bg-purple-100 text-purple-700",
      "Travel": "bg-orange-100 text-orange-700",
      "Food": "bg-red-100 text-red-700",
      "Personal": "bg-pink-100 text-pink-700"
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-600 mb-4">Post Not Found</h1>
          <Link href="/">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
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
            <Link href="/">
              <Button variant="ghost" className="hover:text-indigo-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Stories
              </Button>
            </Link>

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
                    <span className="hidden md:block text-sm font-medium">{session.user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                      </div>
                      <Link href="/dashboard">
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </button>
                      </Link>
                      <Link href="/my-blog">
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          My Blog
                        </button>
                      </Link>
                      <Link href="/profile">
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
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
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Badge className={`${getCategoryColor(post.category)} border-0`}>
              {post.category}
            </Badge>
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-slate-600">
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            {post.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-800">{post.author.name}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLikePost}
                className={`${post.isLiked ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-red-600' : ''}`} />
                {post.likes}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>

        {/* Post Content */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm pt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Comments ({comments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                    <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                      className="min-h-[100px] border-2 border-slate-200 focus:border-indigo-500"
                    />
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600"
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Join the conversation</h3>
                  <p className="text-slate-600 mb-4">Sign in to share your thoughts and engage with other readers</p>
                  <div className="flex items-center justify-center space-x-3">
                    <Link href="/login">
                      <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-slate-100 pb-6 last:border-b-0">
                  <div className="flex space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                      <AvatarFallback>{comment.author.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-slate-50 rounded-lg p-4 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">{comment.author.name}</span>
                          <span className="text-sm text-slate-500">
                            {new Date(comment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 text-slate-500 hover:text-red-600"
                          onClick={() => handleCommentLike(comment.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {comment.likes}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 text-slate-500 hover:text-indigo-600"
                          onClick={() => handleReplyClick(comment.id)}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === comment.id && isAuthenticated && (
                        <div className="mt-4 ml-4">
                          <div className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                              <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
                                className="min-h-[80px] border border-slate-200"
                              />
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                                  onClick={() => handleReplySubmit(comment.id)}
                                  disabled={!replyContent.trim()}
                                >
                                  Reply
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-8 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
                                <AvatarFallback>{reply.author.name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-slate-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm text-slate-800">{reply.author.name}</span>
                                    <span className="text-xs text-slate-500">
                                      {new Date(reply.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-700">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm pt-6">
            <CardHeader>
              <CardTitle>Related Stories</CardTitle>
              <CardDescription>You might also enjoy these stories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/post/${relatedPost.id}`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                      <div className="relative overflow-hidden">
                        <img 
                          src={relatedPost.image} 
                          alt={relatedPost.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className={`absolute top-2 left-2 ${getCategoryColor(relatedPost.category)} border-0 text-xs`}>
                          {relatedPost.category}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{relatedPost.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{relatedPost.author}</span>
                          <span>{relatedPost.readTime}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Authentication Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full pt-6">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">Join Narrativ</CardTitle>
              <CardDescription>
                Sign in to like posts, leave comments, and engage with our community of writers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/login" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => setShowAuthPrompt(false)}
                  >
                    Login to your account
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    onClick={() => setShowAuthPrompt(false)}
                  >
                    Create new account
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setShowAuthPrompt(false)}
                >
                  Continue reading
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

     
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