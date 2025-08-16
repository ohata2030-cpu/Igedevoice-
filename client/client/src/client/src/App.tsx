import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";

// Pages
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import News from "@/pages/News";
import CelebrityNews from "@/pages/CelebrityNews";
import Blog from "@/pages/Blog";
import Music from "@/pages/Music";
import Dating from "@/pages/Dating";
import DatingDashboard from "@/pages/DatingDashboard";
import PostDetail from "@/pages/PostDetail";
import BlogDetail from "@/pages/BlogDetail";
import NotFound from "@/pages/NotFound";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/news" component={News} />
          <Route path="/celebrity" component={CelebrityNews} />
          <Route path="/blog" component={Blog} />
          <Route path="/music" component={Music} />
          <Route path="/dating" component={Dating} />
          <Route path="/dating/dashboard" component={DatingDashboard} />
          <Route path="/posts/:id" component={PostDetail} />
          <Route path="/blog/:id" component={BlogDetail} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="igedevoice-theme">
      <Router />
    </ThemeProvider>
  );
}
