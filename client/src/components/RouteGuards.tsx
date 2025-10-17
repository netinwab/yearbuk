import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoadingSplash from "@/components/LoadingSplash";

interface RootRedirectProps {
  children?: React.ReactNode;
}

export function RootRedirect({ children }: RootRedirectProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, getDashboardPath } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const dashboardPath = getDashboardPath(user);
        setLocation(dashboardPath);
      } else {
        setLocation("/login");
      }
    }
  }, [user, isLoading, setLocation, getDashboardPath]);

  if (isLoading) {
    return <LoadingSplash />;
  }

  return <>{children}</>;
}

interface GuestOnlyRouteProps {
  children: React.ReactNode;
}

export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, getDashboardPath } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      const dashboardPath = getDashboardPath(user);
      setLocation(dashboardPath);
    }
  }, [user, isLoading, setLocation, getDashboardPath]);

  if (isLoading) {
    return <LoadingSplash />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
