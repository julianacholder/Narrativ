'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PenTool, 
  ArrowLeft, 
  User, 
  Mail, 
  Save,
  Upload,
  Camera,
  Globe,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
 
  image: string;
 
}

export default function EditProfile() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    
    image: '',
   
  });

  // Load user data when session is available
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
        
        image: session.user.image || '',
     
      });
    }
  }, [session]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploading(true);
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
      
      const { file_url } = await response.json();
      setProfileData(prev => ({ ...prev, image: file_url }));
      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('Please sign in to update your profile');
      return;
    }

    // Basic validation
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!profileData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    

    setLoading(true);
    try {
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      
      // Optionally redirect back to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
    setLoading(false);
  };

  const handleRemoveImage = () => {
    setProfileData(prev => ({ ...prev, image: '' }));
    toast.success('Profile picture removed');
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <PenTool className="h-8 w-8 text-indigo-600" />
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Narrativ
            </span>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Edit Profile
          </h1>
          <p className="text-slate-600">Update your personal information and preferences</p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm pt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Make changes to your profile here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={profileData.image} alt={profileData.name} />
                    <AvatarFallback className="text-xl md:text-2xl bg-gradient-to-br from-indigo-400 to-purple-400 text-white">
                      {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Camera className="h-4 w-4 text-white" />
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    {uploading ? 'Uploading...' : 'Click the camera icon to change your profile picture'}
                  </p>
                  {profileData.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-700 mt-2"
                    >
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                  required
                />
              </div>

              
              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl h-11"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Link href="/dashboard">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto rounded-xl h-11"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>
              Your account details and membership information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div>
                  <h4 className="font-medium text-slate-900">Account Status</h4>
                  <p className="text-sm text-slate-600">Your account is active and verified</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div>
                  <h4 className="font-medium text-slate-900">Member Since</h4>
                  <p className="text-sm text-slate-600">
                    {session.user.createdAt 
                      ? new Date(session.user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Recently joined'
                    }
                  </p>
                </div>
                <div className="text-indigo-600">
                  <User className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div>
                  <h4 className="font-medium text-slate-900">Posts Created</h4>
                  <p className="text-sm text-slate-600">Total blog posts you've written</p>
                </div>
                <div className="text-purple-600 font-semibold">
                  {/* You can add a posts count here if available */}
                  <span className="text-lg">-</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800">Profile Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-700">
              <li>• Add a professional profile picture to increase engagement</li>
              <li>• Write a compelling bio to tell readers about yourself</li>
              <li>• Include your website or social media links</li>
              <li>• Keep your location updated if you write about local topics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}