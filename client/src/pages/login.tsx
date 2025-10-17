import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, GraduationCap, BookOpen, Users, Camera, Star, Shield, Heart, School, User } from "lucide-react";
import { SiInstagram, SiX, SiWhatsapp } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";
import logoImage from "@assets/logo_background_null.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Test account generation state
  const [showTestAccountDialog, setShowTestAccountDialog] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<"school" | "viewer" | null>(null);
  const [testUsername, setTestUsername] = useState("");
  const [testPassword, setTestPassword] = useState("");

  const getGeolocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation permission denied or unavailable:", error);
          resolve(null);
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setEmailNotVerified(false);
    setResendSuccess(false);

    try {
      // Get user's geolocation
      const geolocation = await getGeolocation();

      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
        geolocation,
      });

      const data = await response.json();
      
      // Check if 2FA is required
      if (data.requires2FA) {
        // Store pending 2FA info in session storage
        sessionStorage.setItem("pending2FAUserId", data.userId);
        sessionStorage.setItem("pending2FAEmail", data.email);
        setLocation("/two-factor-auth");
        return;
      }
      
      // Clear any existing user data before storing new user
      localStorage.removeItem("user");
      localStorage.removeItem("superAdminToken");
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Dispatch custom event to notify CurrencyContext of user change
      window.dispatchEvent(new Event('userChanged'));

      // Backend handles redirection based on user role
      if (data.redirectTo) {
        if (data.user.userType === "super_admin" || data.user.role === "super_admin") {
          localStorage.setItem("superAdminToken", data.user.id);
        }
        setLocation(data.redirectTo);
      }
    } catch (error: any) {
      const errorText = await error.response?.text();
      let errorData;
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch {
        errorData = {};
      }

      // Handle email verification redirect
      if (errorData.emailNotVerified && errorData.redirectTo && errorData.email && errorData.userId) {
        // Pass email and userId as URL params to persist across page refreshes
        const params = new URLSearchParams({
          email: errorData.email,
          userId: errorData.userId
        });
        setLocation(`${errorData.redirectTo}?${params.toString()}`);
        return;
      }

      // Handle pending approval redirect
      if (errorData.pendingApproval && errorData.redirectTo) {
        setLocation(errorData.redirectTo);
        return;
      }

      setError(errorData.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await apiRequest("POST", "/api/resend-verification", {
        email: userEmail,
      });

      const data = await response.json();
      setResendSuccess(true);
      setError("");
    } catch (error: any) {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSelectAccountType = (accountType: "school" | "viewer") => {
    setSelectedAccountType(accountType);
    setTestUsername("");
    setTestPassword("");
    setError("");
  };

  const handleGenerateTestAccount = async () => {
    if (!selectedAccountType || !testUsername.trim() || !testPassword.trim()) {
      setError("Please provide both username and password");
      return;
    }

    setIsGeneratingTest(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/generate-test-account", {
        accountType: selectedAccountType,
        username: testUsername.trim(),
        password: testPassword.trim(),
      });

      const data = await response.json();
      
      // Auto-fill the login form with provided credentials
      setUsername(data.username);
      setPassword(testPassword.trim());
      
      // Close the dialog and reset state
      setShowTestAccountDialog(false);
      setSelectedAccountType(null);
      setTestUsername("");
      setTestPassword("");
      
    } catch (err: any) {
      const errorText = await err.response?.text();
      let errorData;
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch {
        errorData = {};
      }
      setError(errorData.message || "Failed to generate test account. Please try again.");
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-5 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-5 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-5 animate-float-delayed"></div>
        </div>
      </div>

      {/* Left Content Panel - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative z-10">
        <div className="max-w-lg animate-fade-in-up">
          {/* Main Brand Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative ">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                  <img 
                    src={logoImage} 
                    alt="Waibuk Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Yearbuk
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8 animate-fade-in-delayed">
              Where School Memories Live Forever
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="text-center animate-slide-in-left hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-300/50 transition-all duration-300">
                <BookOpen className="text-blue-300 w-8 h-8 hover:text-blue-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Digital Yearbooks</h3>
              <p className="text-blue-200 text-sm">Beautiful, interactive school yearbooks</p>
            </div>
            <div className="text-center animate-slide-in-right hover:scale-105 transition-transform duration-300 animation-delay-200">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-purple-400/30 hover:bg-purple-500/30 hover:border-purple-300/50 transition-all duration-300">
                <Users className="text-purple-300 w-8 h-8 hover:text-purple-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Alumni Network</h3>
              <p className="text-blue-200 text-sm">Connect with classmates worldwide</p>
            </div>
            <div className="text-center animate-slide-in-left hover:scale-105 transition-transform duration-300 animation-delay-400">
              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-green-400/30 hover:bg-green-500/30 hover:border-green-300/50 transition-all duration-300">
                <Camera className="text-green-300 w-8 h-8 hover:text-green-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Memory Discovery</h3>
              <p className="text-blue-200 text-sm">View, discover, and even upload school moments</p>
            </div>
            <div className="text-center animate-slide-in-right hover:scale-105 transition-transform duration-300 animation-delay-600">
              <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-red-400/30 hover:bg-red-500/30 hover:border-red-300/50 transition-all duration-300">
                <Shield className="text-red-300 w-8 h-8 hover:text-red-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Safe & Secure</h3>
              <p className="text-blue-200 text-sm">Protected educational environment</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center animate-fade-in-up animation-delay-800">
            <div className="flex items-center justify-center mb-3">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white animate-avatar-bounce animation-delay-200"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full border-2 border-white animate-avatar-bounce animation-delay-400"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white animate-avatar-bounce animation-delay-600"></div>
              </div>
              <Heart className="text-red-400 w-5 h-5 ml-3 animate-heartbeat" />
            </div>
            <p className="text-blue-200 text-sm animate-fade-in-delayed">
              Trusted by schools worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-center py-8 px-4 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Waibuk Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Yearbuk
          </h1>
          <p className="text-blue-100 text-sm">
            Where School Memories Live Forever
          </p>
        </div>
      </div>

      {/* Login Panel - Full width on mobile, right panel on desktop */}
      <div className="flex-1 lg:w-full lg:max-w-md bg-black/50 backdrop-blur-sm shadow-2xl flex items-center justify-center relative z-10 animate-slide-in-right backdrop-blur-lg ">
        <div className="w-full px-6 pt-2 pb-6 sm:p-6 lg:p-8 max-w-md sm:max-w-md mx-auto">
          {/* Login Header */}
          <div className="text-center mb-8 sm:mb-8 animate-fade-in-up">
            <h3 className="text-5xl sm:text-4xl font-bold text-white mb-4 tracking-wide">Welcome</h3>
            <p className="text-base sm:text-base text-blue-100/80 font-semibold tracking-wider">Sign in to access your portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="block text-sm font-semibold text-white/100">
                Username or Email
              </Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder=""
                className="w-full h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 rounded-lg text-sm sm:text-base bg-white/10 text-white/100"
                data-testid="input-username"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-semibold text-white">
                  Password
                </Label>
                <ForgotPasswordDialog />
              </div>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=""
                autoComplete="current-password"
                className="w-full h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 rounded-lg text-sm sm:text-base bg-white/10 text-white/100"
                data-testid="input-password"
              />
            </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm sm:text-base shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-lg"
              data-testid="button-sign-in"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In to Your Portal"
              )}
            </Button>

            {/* Survey Button */}
            <Button 
              type="button"
              onClick={() => setLocation("/survey")}
              className="w-full h-10 sm:h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs sm:text-sm shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-lg"
              data-testid="button-login-survey"
            >
              📋 Done testing? Take our survey
            </Button>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* TEMPORARY: Email verification disabled during development */}
            {/* Success Message for Resend */}
            {/* {resendSuccess && (
              <Alert className="bg-green-500/20 border-green-400/50 backdrop-blur-sm">
                <AlertDescription className="text-white">
                  Verification email sent! Please check your inbox.
                </AlertDescription>
              </Alert>
            )} */}

            {/* Resend Verification Button */}
            {/* {emailNotVerified && !resendSuccess && (
              <Button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                data-testid="button-resend-verification"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            )} */}
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-white">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-800 font-semibold"
                onClick={() => setLocation("/signup")}
                data-testid="link-signup"
              >
                Sign up here
              </Button>
            </p>
            <p className="text-sm text-white mt-2">
              Or{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-green-400 hover:text-green-300 font-semibold"
                onClick={() => setShowTestAccountDialog(true)}
                data-testid="link-test-account"
              >
                Randomly generate an account
              </Button>
            </p>
          </div>

          {/* About Yearbuk Link */}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-white font-semibold"
              onClick={() => setLocation("/about")}
              data-testid="button-about-yearbuk"
            >
              About Yearbuk
            </Button>
          </div>

          {/* Test Account Type Selection Dialog */}
          <Dialog open={showTestAccountDialog} onOpenChange={(open) => {
            setShowTestAccountDialog(open);
            if (!open) {
              setSelectedAccountType(null);
              setTestUsername("");
              setTestPassword("");
            }
          }}>
            <DialogContent className="bg-slate-800/95 backdrop-blur-lg border-slate-700 shadow-2xl text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  {!selectedAccountType ? "Generate Test Account" : `Create ${selectedAccountType === "school" ? "School" : "Viewer"} Test Account`}
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  {!selectedAccountType 
                    ? "Choose which type of test account you want to create."
                    : "Enter your desired username and password for this test account."
                  }
                </DialogDescription>
              </DialogHeader>
              
              {!selectedAccountType ? (
                <div className="space-y-4 mt-6">
                  <Button
                    onClick={() => handleSelectAccountType("school")}
                    className="w-full h-auto py-6 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-4"
                    data-testid="button-select-school-account"
                  >
                    <School className="h-8 w-8" />
                    <div className="text-left flex-1">
                      <div className="font-bold">School Account</div>
                      <div className="text-sm font-normal opacity-90">For testing school features</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleSelectAccountType("viewer")}
                    className="w-full h-auto py-6 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-4"
                    data-testid="button-select-viewer-account"
                  >
                    <User className="h-8 w-8" />
                    <div className="text-left flex-1">
                      <div className="font-bold">Viewer/Alumni Account</div>
                      <div className="text-sm font-normal opacity-90">For testing viewer features</div>
                    </div>
                  </Button>

                  <div className="mt-6 p-4 bg-amber-900/30 border border-amber-600/40 rounded-lg">
                    <p className="text-sm text-amber-200">
                      ⚠️ <strong>Note:</strong> Accounts are automatically deleted after 12 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="test-username" className="text-white">Username</Label>
                    <Input
                      id="test-username"
                      type="text"
                      placeholder="Enter username"
                      value={testUsername}
                      onChange={(e) => setTestUsername(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      data-testid="input-test-username"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-password" className="text-white">Password(must be at least 6 characters)</Label>
                    <Input
                      id="test-password"
                      type="password"
                      placeholder="Enter password"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      autoComplete="new-password"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      data-testid="input-test-password"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  <div className="p-4 bg-amber-900/30 border border-amber-600/40 rounded-lg">
                    <p className="text-sm text-amber-200">
                      ⚠️ <strong>Note:</strong> Accounts are automatically deleted after 12 hours.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setSelectedAccountType(null)}
                      variant="outline"
                      className="flex-1 border-slate-600 text-blue-500 hover:bg-slate-700"
                      data-testid="button-back-account-type"
                      disabled={isGeneratingTest}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleGenerateTestAccount}
                      disabled={isGeneratingTest || !testUsername.trim() || !testPassword.trim()}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      data-testid="button-create-test-account"
                    >
                      {isGeneratingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <div className="space-x-4">
              <button className="text-xs text-white hover:text-white">Privacy Policy</button>
              <span className="text-gray-300">•</span>
              <button className="text-xs text-white hover:text-white">Terms of Service</button>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex justify-center items-center gap-4">
              <a 
                href="https://www.instagram.com/yearbukservices" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/80 hover:text-pink-400 transition-colors"
                data-testid="link-instagram"
                title="Contact us on Instagram"
              >
                <SiInstagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/80 hover:text-blue-400 transition-colors"
                data-testid="link-twitter"
                title="Contact us on Twitter"
              >
                <SiX className="h-5 w-5" />
              </a>
              <a 
                href="https://wa.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/80 hover:text-green-400 transition-colors"
                data-testid="link-whatsapp"
                title="Contact us on WhatsApp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
