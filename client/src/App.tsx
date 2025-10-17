import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { RootRedirect, GuestOnlyRoute } from "@/components/RouteGuards";
import { YearbookProtection } from "@/components/YearbookProtection";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import TwoFactorAuthPage from "@/pages/two-factor-auth";
import SignupPage from "@/pages/signup";
import SchoolSignupPage from "@/pages/school-signup";
import ViewerSignupPage from "@/pages/viewer-signup";
import VerifyEmailPage from "@/pages/verify-email";
import EmailVerificationPage from "@/pages/email-verification";
import PendingApprovalPage from "@/pages/pending-approval";
import ResetPasswordPage from "@/pages/reset-password";
import SchoolDashboard from "@/pages/school-dashboard";
import ViewerDashboard from "@/pages/viewer-dashboard";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import SuperAdmin from "@/pages/super-admin";
import YearbookManage from "@/pages/yearbook-manage";
import YearbookPreview from "@/pages/yearbook-preview";
import YearbookViewer from "@/pages/yearbook-viewer";
import DynamicYearbookViewer from "@/pages/dynamic-yearbook-viewer";
import YearbookFinder from "@/pages/yearbook-finder";
import PhotosMemoriesManage from "@/pages/photos-memories-manage";
import GuestUpload from "@/pages/guest-upload";
import MemoryUploadRedirect from "@/pages/memory-upload-redirect";
import RequestAlumniStatus from "@/pages/request-alumni-status";
import SchoolSettings from "@/pages/school-settings";
import ViewerSettings from "@/pages/viewer-settings";
import Cart from "@/pages/cart";
import SurveyPage from "@/pages/survey-page";
import AboutPage from "@/pages/about";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <RootRedirect />
      </Route>
      <Route path="/login">
        <GuestOnlyRoute>
          <LoginPage />
        </GuestOnlyRoute>
      </Route>
      <Route path="/two-factor-auth" component={TwoFactorAuthPage} />
      <Route path="/signup">
        <GuestOnlyRoute>
          <SignupPage />
        </GuestOnlyRoute>
      </Route>
      <Route path="/school-signup">
        <GuestOnlyRoute>
          <SchoolSignupPage />
        </GuestOnlyRoute>
      </Route>
      <Route path="/viewer-signup">
        <GuestOnlyRoute>
          <ViewerSignupPage />
        </GuestOnlyRoute>
      </Route>
      <Route path="/verify-email/:token" component={VerifyEmailPage} />
      <Route path="/verify-school-email/:token" component={VerifyEmailPage} />
      <Route path="/email-verification" component={EmailVerificationPage} />
      <Route path="/pending-approval" component={PendingApprovalPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/school-dashboard" component={SchoolDashboard} />
      <Route path="/viewer-dashboard" component={ViewerDashboard} />
      <Route path="/super-admin-dashboard" component={SuperAdminDashboard} />
      <Route path="/super-admin" component={SuperAdmin} />
      <Route path="/yearbook-manage/:year" component={YearbookManage} />
      <Route path="/yearbook-preview/:year" component={YearbookPreview} />
      <Route path="/yearbook-viewer/:year" component={YearbookViewer} />
      <Route path="/yearbook/:schoolId/:year" component={DynamicYearbookViewer} />
      <Route path="/waibuk/:year" component={DynamicYearbookViewer} />
      <Route path="/yearbook-finder" component={YearbookFinder} />
      <Route path="/photos-memories-manage" component={PhotosMemoriesManage} />
      <Route path="/guest-upload/:code?" component={GuestUpload} />
      <Route path="/guest-upload" component={GuestUpload} />
      <Route path="/memory-upload/:token?" component={MemoryUploadRedirect} />
      <Route path="/memory-upload" component={MemoryUploadRedirect} />
      <Route path="/request-alumni-status" component={RequestAlumniStatus} />
      <Route path="/school-settings" component={SchoolSettings} />
      <Route path="/viewer-settings" component={ViewerSettings} />
      <Route path="/cart" component={Cart} />
      <Route path="/survey" component={SurveyPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <YearbookProtection />
            <Toaster />
            <Router />
          </TooltipProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
