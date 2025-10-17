import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, CreditCard, Bell, Shield, Menu, Eye, EyeOff, Edit, Check, X, Settings, ShoppingCart, LogOut, MenuIcon, Home, Key, RefreshCw, Receipt, Clock, MapPin, Monitor, Smartphone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import type { User as UserType, AlumniBadge, Notification } from "@shared/schema";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";

export default function ViewerSettings() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const { userCurrency, setUserCurrency, formatPrice } = useCurrency();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: "",
    username: "",
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Unlock year state
  const [codeInput, setCodeInput] = useState("");
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);

  // Individual field editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState({
    email: "",
    username: "",
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch alumni badges for account status
  const { data: alumniBadges = [] } = useQuery<AlumniBadge[]>({
    queryKey: ['/api/alumni-badges', user?.id],
    enabled: !!user
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user
  });

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // Fetch payment history
  const { data: paymentHistory = [], isLoading: isLoadingPayments } = useQuery<Array<{
    id: string;
    userId: string;
    schoolId: string;
    year: number;
    purchased: boolean;
    purchaseDate: Date | null;
    price: string | null;
    paymentReference: string | null;
    createdAt: Date | null;
    schoolName: string;
  }>>({
    queryKey: ['/api/payment-history', user?.id],
    enabled: !!user
  });

  // Fetch login activity (for security tab)
  const { data: loginActivity = [], isLoading: loadingLoginActivity } = useQuery<any[]>({
    queryKey: ["/api/users", user?.id, "login-activity"],
    enabled: !!user?.id && activeTab === "security",
  });

  // Fetch most recent login (for security tab)
  const { data: recentLogin, isLoading: loadingRecentLogin } = useQuery<any>({
    queryKey: ["/api/users", user?.id, "recent-login"],
    enabled: !!user?.id && activeTab === "security",
  });

  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
    }
  });

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  };

  // Determine account status (consistent with viewer-dashboard logic)
  const getAccountStatus = () => {
    if (!user || !user.userType) return 'Unknown';
    
    // Count verified and total badges
    const verifiedBadges = alumniBadges.filter((badge: any) => badge.status === 'verified');
    const totalBadges = alumniBadges.length;
    
    switch (user.userType.toLowerCase()) {
      case 'student':
        return 'Student';
      case 'viewer':
        if (totalBadges > 0) {
          // User has alumni badges (either verified or pending)
          return `Alumni(${verifiedBadges.length})`;
        } else {
          return 'Viewer';
        }
      case 'school':
        return 'School Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'Unknown';
    }
  };
  
  const accountStatus = getAccountStatus();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Initialize profile form with current user data
    setProfileForm(prev => ({
      ...prev,
      email: parsedUser.email || "",
      username: parsedUser.username || "",
      fullName: parsedUser.fullName || ""
    }));
  }, [setLocation]);

  const handleBackClick = () => {
    setLocation("/viewer-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("No user found");
      
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userChanged'));
      setUser(updatedUser);
      
      // Update form state
      setProfileForm(prev => ({
        ...prev,
        email: updatedUser.email || "",
        username: updatedUser.username || "",
        fullName: updatedUser.fullName || ""
      }));
      
      toast({
        className: "bg-blue-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Reset editing state
      setEditingField(null);
      setIsUpdatingProfile(false);
    },
    onError: (error: any) => {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      setIsUpdatingProfile(false);
    }
  });

  const handleSaveField = (field: string) => {
    if (!user) return;
    
    const value = tempValues[field as keyof typeof tempValues];
    if (!value.trim()) {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Invalid input",
        description: "Field cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    updateProfileMutation.mutate({ [field]: value });
  };

  const handleCancelEdit = (field: string) => {
    setEditingField(null);
    setTempValues(prev => ({
      ...prev,
      [field]: profileForm[field as keyof typeof profileForm]
    }));
  };

  const startEditing = (field: string) => {
    setEditingField(field);
    setTempValues(prev => ({
      ...prev,
      [field]: profileForm[field as keyof typeof profileForm]
    }));
  };

  const renderProfileTab = () => (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-white">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          {/* Full Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="fullName" data-testid="label-full-name" className="text-sm font-medium text-white">Full Name</Label>
            <div className="flex items-center gap-2">
              {editingField === "fullName" ? (
                <>
                  <Input
                    id="fullName"
                    value={tempValues.fullName}
                    onChange={(e) => setTempValues(prev => ({ ...prev, fullName: e.target.value }))}
                    className="flex-1 h-10 sm:h-11 bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/60"
                    data-testid="input-full-name-edit"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveField("fullName")}
                    disabled={isUpdatingProfile}
                    data-testid="button-save-full-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelEdit("fullName")}
                    disabled={isUpdatingProfile}
                    data-testid="button-cancel-full-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="fullName"
                    value={profileForm.fullName}
                    readOnly
                    className="flex-1 bg-white/5 backdrop-blur-lg border border-white/20 text-white/70 h-10 sm:h-11"
                    data-testid="input-full-name"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("fullName")}
                    data-testid="button-edit-full-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Username Field */}
          <div className="grid gap-2">
            <Label htmlFor="username" data-testid="label-username" className="text-sm font-medium text-white">Username</Label>
            <div className="flex items-center gap-2">
              {editingField === "username" ? (
                <>
                  <Input
                    id="username"
                    value={tempValues.username}
                    onChange={(e) => setTempValues(prev => ({ ...prev, username: e.target.value }))}
                    className="flex-1 h-10 sm:h-11 bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/60"
                    data-testid="input-username-edit"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveField("username")}
                    disabled={isUpdatingProfile}
                    data-testid="button-save-username"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelEdit("username")}
                    disabled={isUpdatingProfile}
                    data-testid="button-cancel-username"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="username"
                    value={profileForm.username}
                    readOnly
                    className="flex-1 bg-white/5 backdrop-blur-lg border border-white/20 text-white/70 h-10 sm:h-11"
                    data-testid="input-username"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("username")}
                    data-testid="button-edit-username"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="grid gap-2">
            <Label htmlFor="email" data-testid="label-email" className="text-sm font-medium text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileForm.email}
              readOnly
              disabled
              className="bg-white/5 backdrop-blur-lg border border-white/20 text-white/70 h-10 sm:h-11 cursor-not-allowed"
              data-testid="input-email"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-white">Currency Preference</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-3">
            <Label htmlFor="currency" className="text-sm font-medium text-white">Preferred Currency</Label>
            <Select value={userCurrency} onValueChange={(value: Currency) => setUserCurrency(value)}>
              <SelectTrigger className="h-10 sm:h-11 bg-white/10 backdrop-blur-lg border border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-600/60 backdrop-blur-lg border border-white/20 text-white">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="NGN">NGN (₦)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs sm:text-sm text-white/70">
              Prices will be displayed in your preferred currency.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Redeem yearbook code mutation
  const redeemCode = async () => {
    if (!codeInput.trim() || !user) {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Invalid Input",
        description: "Please enter a valid code",
        variant: "destructive"
      });
      return;
    }

    setIsRedeemingCode(true);
    try {
      const response = await apiRequest("POST", "/api/yearbook-codes/redeem", {
        code: codeInput.trim().toUpperCase(),
        userId: user.id
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          className: "bg-green-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Code Redeemed!",
          description: `Successfully unlocked ${data.year} yearbook access`,
        });
        setCodeInput("");
        // Invalidate any queries that might show yearbook access
        queryClient.invalidateQueries({ queryKey: ["/api/yearbook-access"] });
      } else {
        toast({
          className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
          title: "Redemption Failed",
          description: data.message || "Invalid or expired code",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        className: "bg-red-600/60 backdrop-blur-lg border border-white/20 shadow-2xl text-white",
        title: "Redemption Failed",
        description: error.message || "Failed to redeem code",
        variant: "destructive"
      });
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const renderUnlockYearTab = () => {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-2xl">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-white flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Unlock Yearbook Access
            </CardTitle>
            <p className="text-sm text-white/70">
              Enter a 12-digit access code to unlock a specific yearbook year.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-code" className="text-sm font-medium text-white">
                  Access Code
                </Label>
                <Input
                  id="access-code"
                  value={codeInput}
                  onChange={(e) => {
                    // Format input as XXXX-XXXX-XXXX (allow alphanumeric characters)
                    let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
                    if (value.length > 4 && value.length <= 8) {
                      value = value.slice(0, 4) + '-' + value.slice(4);
                    } else if (value.length > 8) {
                      value = value.slice(0, 4) + '-' + value.slice(4, 8) + '-' + value.slice(8);
                    }
                    setCodeInput(value);
                  }}
                  placeholder="XXXX-XXXX-XXXX"
                  className="h-12 text-center font-mono text-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                  maxLength={14}
                  data-testid="input-access-code"
                />
                <p className="text-xs text-white/60">
                  Enter the 12-digit code provided by your school to unlock yearbook access.
                </p>
              </div>
              
              <Button
                onClick={redeemCode}
                disabled={isRedeemingCode || codeInput.length < 14}
                className="w-full h-12 text-base font-medium"
                data-testid="button-redeem-code"
              >
                {isRedeemingCode ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Redeeming Code...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Unlock Yearbook
                  </>
                )}
              </Button>
              
              <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">How it works:</h3>
                <ul className="text-sm text-white/70 space-y-1">
                  <li>• Get a 12-digit access code from your school</li>
                  <li>• Enter the code above to unlock specific yearbook years</li>
                  <li>• Each code can only be used once</li>
                  <li>• You cannot redeem codes for years you already have access to</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPaymentHistoryTab = () => {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-white flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Payment History
            </CardTitle>
            <p className="text-sm text-white/70">
              View all your yearbook purchases and payment records.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {isLoadingPayments ? (
              <div className="text-center py-8 text-white/70">Loading payment history...</div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No payment history found.</p>
                <p className="text-sm mt-1">Your paid yearbook purchases will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                    data-testid={`payment-item-${payment.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-base" data-testid={`text-school-${payment.id}`}>
                          {payment.schoolName}
                        </h3>
                        <p className="text-white/60 text-sm" data-testid={`text-year-${payment.id}`}>
                          Year: {payment.year}
                        </p>
                        {payment.purchaseDate && (
                          <p className="text-white/50 text-xs mt-1" data-testid={`text-date-${payment.id}`}>
                            Purchased: {new Date(payment.purchaseDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <span className="text-white font-semibold text-lg" data-testid={`text-price-${payment.id}`}>
                          {formatPrice(parseFloat(payment.price || '0'))}
                        </span>
                        {payment.paymentReference && (
                          <span className="text-white/40 text-xs font-mono" data-testid={`text-reference-${payment.id}`}>
                            Ref: {payment.paymentReference.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSecurityTab = () => {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-6xl">
        {/* Most Recent Login Card */}
        {recentLogin && (
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl flex items-center text-white">
                <Shield className="h-5 w-5 mr-2 text-green-400" />
                Most Recent Login
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center text-white/70 text-sm">
                    <Smartphone className="h-4 w-4 mr-2" />
                    <span>Device: {recentLogin.deviceType || 'Unknown'} - {recentLogin.browser || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-white/70 text-sm">
                    <Monitor className="h-4 w-4 mr-2" />
                    <span>OS: {recentLogin.os || 'Unknown'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-white/70 text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Location: {recentLogin.city || recentLogin.country || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-white/70 text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{new Date(recentLogin.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Activity History */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center text-white">
              <Clock className="h-5 w-5 mr-2 text-blue-400" />
              Login Activity
            </CardTitle>
            <p className="text-sm text-white/70 mt-2">
              Review your recent login history and security activity
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loadingLoginActivity ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : loginActivity && loginActivity.length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                {loginActivity.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            activity.loginStatus === 'success' 
                              ? 'bg-green-500/20 text-green-200' 
                              : 'bg-red-500/20 text-red-200'
                          }`}>
                            {activity.loginStatus === 'success' ? 'Successful' : 'Failed'}
                          </span>
                          {activity.failureReason && (
                            <span className="text-xs text-red-300">({activity.failureReason})</span>
                          )}
                        </div>
                        <div className="text-white/80 text-sm">
                          {activity.browser} on {activity.os} - {activity.deviceType}
                        </div>
                        <div className="text-white/60 text-xs">
                          {activity.city || activity.country || 'Unknown location'} • {activity.ipAddress}
                        </div>
                      </div>
                      <div className="text-white/60 text-xs whitespace-nowrap">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No login activity recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings - Can be expanded */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center text-white">
              <Settings className="h-5 w-5 mr-2 text-purple-400" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              {/* Change Password Section - TEST MODE: Disabled */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 opacity-50">
                <h3 className="text-white font-medium mb-2">Change Password</h3>
                <p className="text-white/60 text-sm mb-3">
                  Reset your password securely via email verification
                </p>
                <Button variant="outline" size="sm" className="text-white border-white/20" disabled>
                  Disabled in Test Mode
                </Button>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white font-medium mb-2">Two-Factor Authentication</h3>
                <p className="text-white/60 text-sm mb-3">Add an extra layer of security to your account</p>
                <Button variant="outline" size="sm" className="text-white border-white/20" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "unlock":
        return renderUnlockYearTab();
      case "payments":
        return renderPaymentHistoryTab();
      case "security":
        return renderSecurityTab();
      default:
        return renderProfileTab();
    }
  };

  // Handle click outside hamburger menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHamburgerMenu) {
        const target = event.target as Element;
        if (!target.closest('[data-testid="button-hamburger-menu"]') && !target.closest('.hamburger-dropdown')) {
          setShowHamburgerMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHamburgerMenu]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Main Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-20 animate-float-delayed"></div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl relative">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 left-10 w-8 h-8 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute top-3 right-20 w-6 h-6 bg-white rounded-full opacity-5 animate-float-delayed"></div>
            <div className="absolute bottom-2 left-20 w-5 h-5 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute bottom-1 right-10 w-4 h-4 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          </div>
        </div>
        <div className="mx-auto px-2 sm:px-4 lg:px-8 xl:px-12 2xl:px-16 relative z-10">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="text-white hover:bg-white/20 flex-shrink-0 mr-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {/* Mobile sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-white hover:bg-white/20 lg:hidden flex-shrink-0 mr-2"
                data-testid="button-sidebar-toggle"
              >
                <MenuIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="text-white text-xs sm:text-sm" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white truncate">Settings</h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
              {/* Survey Button */}
              <Button
                onClick={() => setLocation("/survey")}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 shadow-lg"
                data-testid="button-survey"
              >
                <span className="hidden sm:inline">Done testing? Please take this survey</span>
                <span className="sm:hidden">📋 Survey</span>
              </Button>

              {/* Mobile Circle Status Indicator - Show only on small screens */}
              <div className="sm:hidden relative">
                {accountStatus === "Alumni" ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {alumniBadges.filter(b => b.status === "verified").length}
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                )}
              </div>
              
              {/* Desktop Account Status Indicator - Hidden on small screens */}
              <div className={`hidden sm:block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                accountStatus.startsWith("Alumni") 
                  ? "bg-green-500/20 text-green-200 border border-green-400/30" 
                  : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
              }`}>
                <span className="hidden md:inline">Account Status: </span>{accountStatus}
              </div>
              
              {/* Notification Bell */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-white hover:bg-white/20"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </Button>
              </div>
              
              <span className="text-xs sm:text-sm font-medium text-white hidden xs:block">
                <span className="hidden sm:inline">{user.fullName}</span>
                <span className="sm:hidden">{user.fullName.split(" ")[0]}</span>
              </span>
              
              {/* Hamburger Menu - Positioned independently */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                  className="text-white hover:bg-white/20 p-2 bg-white/10 rounded-lg border border-white/20 ml-3"
                  data-testid="button-hamburger-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
              </div>
              
            </div>
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="notification-dropdown fixed top-16 right-16 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-blue-600/60 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 z-[999999]">
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotifications(false)}
              >
                <X className="h-4 w-4 text-white hover:text-red-500" />
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-white/70">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b border-white/20 hover:bg-white/10 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-500/20' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkNotificationRead(notification.id);
                    }
                  }}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-white/80 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/60 mt-2">
                        {new Date(notification.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hamburger Menu Dropdown */}
      {showHamburgerMenu && (
        <div className="hamburger-dropdown fixed top-16 right-4 w-48 bg-blue-600/60 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-[999999]">
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                setLocation("/viewer-dashboard");
              }}
              data-testid="menu-home"
            >
              <Home className="h-4 w-4 mr-3" />
              Home
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                setLocation("/viewer-settings");
              }}
              data-testid="menu-settings"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setShowHamburgerMenu(false);
                setLocation("/cart");
              }}
              data-testid="menu-cart"
            >
              <ShoppingCart className="h-4 w-4 mr-3" />
              Cart
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm hover:bg-red-500/40 transition-colors text-red-500"
              onClick={() => {
                setShowHamburgerMenu(false);
                handleLogout();
              }}
              data-testid="menu-logout"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className="flex">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block w-64 min-h-screen bg-white/10 backdrop-blur-lg border-r border-white/20">
          <div className="p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                  activeTab === "profile"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-profile"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("unlock")}
                className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                  activeTab === "unlock"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-unlock"
              >
                <Key className="h-4 w-4 mr-2" />
                Unlock Year
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                  activeTab === "payments"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-payments"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Payment History
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                  activeTab === "security"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-security"
              >
                <Shield className="h-4 w-4 mr-2" />
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 pt-20">
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setShowSidebar(false);
                }}
                className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors touch-manipulation ${
                  activeTab === "profile"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-profile-mobile"
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </button>
              <button
                onClick={() => {
                  setActiveTab("unlock");
                  setShowSidebar(false);
                }}
                className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors touch-manipulation ${
                  activeTab === "unlock"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-unlock-mobile"
              >
                <Key className="h-5 w-5 mr-3" />
                Unlock Year
              </button>
              <button
                onClick={() => {
                  setActiveTab("payments");
                  setShowSidebar(false);
                }}
                className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors touch-manipulation ${
                  activeTab === "payments"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-payments-mobile"
              >
                <Receipt className="h-5 w-5 mr-3" />
                Payment History
              </button>
              <button
                onClick={() => {
                  setActiveTab("security");
                  setShowSidebar(false);
                }}
                className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors touch-manipulation ${
                  activeTab === "security"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid="tab-security-mobile"
              >
                <Shield className="h-5 w-5 mr-3" />
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}