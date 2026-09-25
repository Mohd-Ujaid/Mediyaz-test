"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth";
import { authClient } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShieldCheck, User2, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminProfilePage() {
  const { data: session, isPending, error } = useSession();
  
  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setPhone((session.user as any).phone || "");
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      // 1. Update Better Auth User (Name)
      const authRes = await authClient.updateUser({ name });
      
      if (authRes.error) {
        throw new Error(authRes.error.message || "Failed to update auth profile");
      }

      // 2. Sync Custom Fields and Employee Document
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    
    setIsSavingPassword(true);

    try {
      const authRes = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });

      if (authRes.error) {
        throw new Error(authRes.error.message || "Failed to update password");
      }

      toast.success("Password updated securely!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong updating password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const role = (session?.user as any)?.role || "Unknown Role";
  const permissions: string[] = (session?.user as any)?.permissions || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, security preferences, and view your system access level.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="general" className="gap-2">
            <User2 className="h-4 w-4" />
            General Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security & Access
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card className="border-brand-500/10 shadow-md">
            <form onSubmit={handleUpdateProfile}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your basic profile details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="john@hospital.com"
                      required
                      disabled // Better auth usually requires email verification to change email. We disable it for now or rely on sync.
                    />
                    <p className="text-xs text-muted-foreground">Email changes must be requested through a Super Admin.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t flex justify-end p-4">
                <Button type="submit" disabled={isSavingProfile} className="bg-brand-600 hover:bg-brand-700">
                  {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-brand-500/10 shadow-md">
            <form onSubmit={handleUpdatePassword}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Ensure your account is using a long, random password to stay secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t flex justify-end p-4">
                <Button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} className="bg-brand-600 hover:bg-brand-700">
                  {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-brand-500/10 shadow-md">
            <CardHeader>
              <CardTitle>Active Role & Permissions</CardTitle>
              <CardDescription>
                Below is a read-only view of your current system access level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Primary Role</h4>
                  <Badge variant={["ADMIN", "SUPER_ADMIN"].includes(role) ? "default" : "secondary"} className={["ADMIN", "SUPER_ADMIN"].includes(role) ? "bg-brand-600" : ""}>
                    {role.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Granted Modules</h4>
                  {permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-slate-600 bg-slate-50">
                          {perm.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No additional module permissions granted.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
