"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Function to fetch session from API
  const fetchSession = async () => {
    try {
      console.log("🔍 Fetching session from /api/auth/session");
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error("❌ Session API response not ok:", response.status);
        return null;
      }

      const data = await response.json();
      console.log("✅ Session API response:", data);
      
      return data.user || null;
    } catch (error) {
      console.error("💥 Error fetching session:", error);
      return null;
    }
  };

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      console.log("🔍 Checking for existing session...");
      setSessionLoading(true);
      
      const user = await fetchSession();
      console.log("🔍 Initial session check result:", user);
      
      setCurrentUser(user);
      setSessionLoading(false);
      
      // If user is already logged in, redirect to dashboard
      if (user) {
        console.log("✅ User already logged in, redirecting to dashboard");
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 LOGIN COMPONENT STATE:");
    console.log("  - sessionLoading:", sessionLoading);
    console.log("  - currentUser:", currentUser);
    console.log("  - isLoading:", isLoading);
  }, [sessionLoading, currentUser, isLoading]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    console.log("🔐 Starting login process for email:", email);

    try {
      const result = await signIn.email(
        {
          email,
          password
        },
        {
          onRequest: (ctx) => {
            console.log("🔐 Login request started...");
          },
          onResponse: async (ctx) => {
            console.log("✅ Login response received:", ctx);
            console.log("✅ Response status:", ctx.response.status);
            console.log("✅ Response ok:", ctx.response.ok);
            
            // Check if response is successful
            if (ctx.response.ok) {
              console.log("✅ Login successful, checking session...");
              toast.success("Login successful!");
              
              // Wait a moment for session to be established, then check
              setTimeout(async () => {
                console.log("🔍 Fetching fresh session after login...");
                
                let attempts = 0;
                const maxAttempts = 5;
                let user = null;
                
                // Retry session check multiple times
                while (attempts < maxAttempts && !user) {
                  attempts++;
                  console.log(`🔍 Session check attempt ${attempts}/${maxAttempts}`);
                  
                  user = await fetchSession();
                  
                  if (user) {
                    console.log("✅ Session confirmed, redirecting to dashboard");
                    setCurrentUser(user);
                    setIsLoading(false);
                    router.push("/dashboard");
                    return;
                  }
                  
                  // Wait before next attempt
                  if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
                
                if (!user) {
                  console.log("❌ No session found after multiple attempts, redirecting anyway");
                  setIsLoading(false);
                  router.push("/dashboard");
                }
              }, 1000);
              
            } else {
              console.error("❌ Login failed with status:", ctx.response.status);
              setIsLoading(false);
              toast.error("Login failed. Please check your credentials.");
            }
          },
          onError: (ctx) => {
            console.error("❌ Login error:", ctx.error);
            setIsLoading(false);
            
            // Handle specific error cases
            const errorMessage = ctx.error?.message?.toLowerCase() || "";
            
            if (errorMessage.includes("invalid email") || errorMessage.includes("user not found")) {
              toast.error("No account found with this email");
            } else if (errorMessage.includes("password") || errorMessage.includes("credentials")) {
              toast.error("Incorrect password. Please try again.");
            } else if (errorMessage.includes("invalid credentials")) {
              toast.error("Invalid email or password. Please try again.");
            } else {
              toast.error("Login failed. Please try again.");
            }
          }
        }
      );

      console.log("🔍 SignIn result:", result);

    } catch (error) {
      console.error("💥 Login catch error:", error);
      setIsLoading(false);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      await signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard"
        },
        {
          onRequest: (ctx) => {
            console.log("🔐 Google login request started...");
          },
          onResponse: (ctx) => {
            console.log("✅ Google login response:", ctx);
            setIsLoading(false);
            
            // For social login, check if response is successful
            if (ctx.response.ok) {
              console.log("✅ Google login successful");
              toast.success("Google login successful!");
              // Social login usually handles redirect automatically
            }
          },
          onError: (ctx) => {
            console.error("❌ Google login error:", ctx.error);
            setIsLoading(false);
            toast.error("Google sign-in failed. Please try again.");
          }
        }
      );

    } catch (error) {
      console.error("💥 Google login catch error:", error);
      setIsLoading(false);
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  // Show loading while checking initial session
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      {/* Debug Panel - Remove this in production */}
      <div className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xs z-50 overflow-auto max-h-96">
        <h3 className="font-bold mb-2">Session Debug:</h3>
        <p>sessionLoading: {sessionLoading ? 'true' : 'false'}</p>
        <p>isLoading: {isLoading ? 'true' : 'false'}</p>
        <p>hasUser: {currentUser ? 'true' : 'false'}</p>
        <p>userID: {currentUser?.id || 'null'}</p>
        <p>userEmail: {currentUser?.email || 'null'}</p>
        <p>userName: {currentUser?.name || 'null'}</p>
        <div className="mt-2 text-xs bg-gray-800 p-2 rounded max-h-32 overflow-auto">
          <p className="font-bold">User Data:</p>
          <pre>{JSON.stringify(currentUser, null, 1)}</pre>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")}
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>
        
        <Card className="animate-fade-in pt-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <PenTool className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">Narrativ</span>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue writing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4 mb-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isLoading}
              onClick={handleGoogleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="0.98em" height="1em" viewBox="0 0 256 262">
                <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
                <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
              </svg>
              Sign in with Google
            </Button>
            
            <div className="text-center mt-6">
              <span className="text-sm text-slate-600">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => router.push("/signup")}
                  disabled={isLoading}
                >
                  Sign up
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;