import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, School, Users, Shield, Workflow, Heart } from "lucide-react";
import logoImage from "@assets/logo_background_null.png";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-20 animate-float-delayed"></div>
        </div>
      </div>

      {/* Survey Banner */}
      <div className="relative z-10 bg-gradient-to-r from-amber-500 to-orange-600 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => setLocation("/survey")}
            className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg transition-all duration-200"
            data-testid="button-survey-banner"
          >
            Done testing? Take our survey →
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-6">
              <img 
                src={logoImage} 
                alt="Yearbuk Logo" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              About Yearbuk
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
              A digital yearbook platform built to bring schools, students, and alumni together in a modern, interactive way.
            </p>
          </div>

          {/* What is Yearbuk */}
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-2xl text-white">What is Yearbuk?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                Yearbuk is a digital yearbook platform built to bring schools, students, and alumni together in a modern, interactive way.
                It reimagines traditional printed yearbooks into a simple, secure, and accessible online system that anyone can explore anytime, anywhere.
              </p>
            </CardContent>
          </Card>

          {/* For Schools */}
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <School className="h-6 w-6 text-green-400" />
                <CardTitle className="text-2xl text-white">For Schools</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">Schools can:</p>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Create and manage digital yearbooks for each graduating class.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Choose between PDF uploads or image-based pages for flexibility.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Set their own yearbook prices, manage alumni requests, and track purchases.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Generate upload codes for students to submit memories and photos directly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Communicate with verified alumni through the built-in notification system.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Enjoy full control over their content with advanced moderation tools.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* For Viewers and Alumni */}
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-2xl text-white">For Viewers and Alumni</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">Viewers and alumni can:</p>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Search and access their school's yearbooks instantly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Verify their alumni status to unlock upload privileges and alumni badges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Receive notifications when new uploads or updates are available.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Purchase and view yearbooks in a realistic page-flip experience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Manage alumni badges which grant alumni status to a school.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Security & Verification */}
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-yellow-400" />
                <CardTitle className="text-2xl text-white">Security & Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 leading-relaxed">
                Yearbuk uses email verification, 2FA, and encrypted storage to ensure that all accounts and data are fully secure.
                Schools must be verified by the Yearbuk moderation team before they can publish content, keeping the platform professional and authentic.
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Workflow className="h-6 w-6 text-cyan-400" />
                <CardTitle className="text-2xl text-white">How It Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">1</span>
                  <span className="pt-1">Schools sign up, verify, and start creating digital yearbooks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">2</span>
                  <span className="pt-1">Alumni and viewers join to explore, view, and contribute to their class memories.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">3</span>
                  <span className="pt-1">Yearbuk connects everyone through secure uploads, purchase systems, and community updates — making nostalgia interactive and accessible.</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Our Vision */}
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-pink-400" />
                <CardTitle className="text-2xl text-white">Our Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 leading-relaxed">
                Yearbuk was built to preserve memories in a more accessible, eco-friendly way.
                We aim to make yearbooks live forever — beautifully designed, secure, and always within reach.
              </p>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card className="mb-8 bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">
                If you encounter any issues or want to share suggestions, you can reach out directly through the survey link above.
              </p>
            </CardContent>
          </Card>

          {/* Back to Login Button */}
          <div className="text-center">
            <Button
              onClick={() => setLocation("/login")}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200"
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
