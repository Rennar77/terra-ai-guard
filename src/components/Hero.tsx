import { Button } from "@/components/ui/button";
import { Leaf, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroEarth from "@/assets/hero-earth.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroEarth})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Logo/Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
          <Leaf className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold text-white">GaiaGuard AI</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Predict. Restore. Protect.
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
          Healing Earth Intelligently with AI
        </p>

        <p className="text-lg text-white/75 mb-12 max-w-2xl mx-auto">
          Harness the power of satellite data and artificial intelligence to detect land degradation, 
          recommend restoration actions, and protect our planet's future.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="text-lg px-8 py-6"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Explore Land Health
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary"
          >
            <Shield className="mr-2 h-5 w-5" />
            Get Restoration Plan
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-4 justify-center">
          {[
            "Real-time Satellite Data",
            "AI-Powered Insights", 
            "Climate Risk Analysis",
            "Restoration Recommendations"
          ].map((feature) => (
            <div 
              key={feature}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white text-sm font-medium"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default Hero;
