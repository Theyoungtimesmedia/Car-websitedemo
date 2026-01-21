import { Home, TrendingUp, Wallet, BarChart3, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Plans', href: '/plans', icon: TrendingUp },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Transactions', href: '/transactions', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-1 text-xs transition-all duration-300 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full" />
              )}
              
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "font-medium mt-0.5 transition-all duration-300",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
