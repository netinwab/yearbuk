import { useState, useEffect } from "react";

interface User {
  id: string;
  userType: "school" | "viewer" | "super_admin";
  role?: string;
  username: string;
  email: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const getDashboardPath = (user: User): string => {
    if (user.userType === "super_admin" || user.role === "super_admin") {
      return "/super-admin";
    }
    if (user.userType === "school") {
      return "/school-dashboard";
    }
    if (user.userType === "viewer") {
      return "/viewer-dashboard";
    }
    return "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    getDashboardPath,
  };
}
