import { ArrowRight, Shield, TrendingUp, Clock, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Landing = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Shield,
      title: "Secure Investment",
      description: "Get small regular payouts every 22 hours — start from $5"
    },
    {
      icon: TrendingUp,
      title: "Guaranteed Returns",
      description: "Earn up to 300% returns on your investment plans"
    },
    {
      icon: Clock,
      title: "Daily Drops",
      description: "Regular income drops delivered straight to your wallet"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-16 pb-20 rounded-b-[3rem]">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm">
            <Gift className="h-4 w-4" />
            <span>$1 Welcome Bonus for New Users</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Welcome to<br />
            <span className="text-warning">Luno Rise</span>
          </h1>
          
          <p className="text-lg text-primary-foreground/80 max-w-sm mx-auto">
            Smart investment platform with guaranteed daily returns. Start earning today.
          </p>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth/register')}
              className="bg-white text-primary hover:bg-white/90 font-bold h-14 rounded-2xl text-lg shadow-lg"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/auth/login')}
              className="text-primary-foreground hover:bg-white/10 font-semibold h-14 rounded-2xl"
            >
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Benefit Cards */}
      <div className="px-6 -mt-10">
        <div className="grid gap-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="bg-card border-0 shadow-card p-5 rounded-2xl hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">
          © 2024 Luno Rise. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Landing;
