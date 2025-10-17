import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/logo_background_null.png";

export default function SurveyPage() {
  const [, setLocation] = useLocation();
  const SCHOOL_SURVEY_LINK = "https://surveymars.com/q/3fA5sI5k0";
  const VIEWER_SURVEY_LINK = "https://surveymars.com/q/NQfVbLVBi";

  const openSurvey = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800/90 border-slate-700 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8 relative">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 text-slate-300 hover:text-white hover:bg-slate-700/50"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl">
              <img 
                src={logoImage} 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Help Us Improve!
          </CardTitle>
          <CardDescription className="text-lg text-slate-300">
            Thank you for testing our platform. Please take a moment to share your feedback.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={() => openSurvey(SCHOOL_SURVEY_LINK)}
              size="lg"
              className="h-auto py-6 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center gap-3"
              data-testid="button-school-survey"
            >
              <ExternalLink className="h-6 w-6" />
              <div className="text-center">
                <div>Take School</div>
                <div>Account Survey</div>
              </div>
            </Button>
            
            <Button
              onClick={() => openSurvey(VIEWER_SURVEY_LINK)}
              size="lg"
              className="h-auto py-6 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center gap-3"
              data-testid="button-viewer-survey"
            >
              <ExternalLink className="h-6 w-6" />
              <div className="text-center">
                <div>Take Viewer</div>
                <div>Account Survey</div>
              </div>
            </Button>
          </div>
          
          <div className="text-center text-sm text-slate-400 mt-8">
            Your feedback helps us build a better experience for everyone.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
