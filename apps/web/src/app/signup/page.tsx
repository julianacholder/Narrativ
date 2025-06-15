"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, ArrowLeft, Eye, EyeOff, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signUp } from "@/lib/auth-client";  // <-- assuming you're using better-auth client SDK

const SignupPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await signUp.email({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        image: image ? await convertImageToBase64(image) : "",
        callbackURL: "/dashboard", // optional callback if better-auth supports it
        fetchOptions: {
          onRequest: () => setIsLoading(true),
          onResponse: () => setIsLoading(false),
          onError: (ctx) => {
            setError(ctx.error.message || "An error occurred");
          },
          onSuccess: () => {
            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => router.push("/login"), 2000);
          },
        },
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
    if (error) setError("");
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="flex items-center space-x-2 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm pt-6">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <PenTool className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Narrativ
              </span>
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-800">Join Narrativ</CardTitle>
              <CardDescription className="text-slate-700 mt-2 text-sm">
                Create your account and start sharing your stories
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSignup} className="space-y-4">

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 animate-fade-in">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 animate-fade-in">
                  <p className="text-sm text-green-600 font-medium">{success}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="Enter your full name"
                  value={formData.name} onChange={handleInputChange} disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Enter your email"
                  value={formData.email} onChange={handleInputChange} disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min 8 characters)"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Profile Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Profile Image (optional)</Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <X
                        className="absolute top-0 right-0 bg-white rounded-full cursor-pointer"
                        onClick={() => { setImage(null); setImagePreview(null); }}
                      />
                    </div>
                  )}
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg"
                disabled={isLoading || !isFormValid()}>
                {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating Account...</>) : "Create Account"}
              </Button>
            </form>

            <div className="text-center text-sm">
              Already have an account? <Link href="/login" className="font-medium text-indigo-700">Sign in</Link>
            </div>

          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-500 mt-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

// Helper function to convert image to base64 string
async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
