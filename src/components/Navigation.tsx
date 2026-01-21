import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

const Navigation = ({ currentSection, onSectionChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    { key: 'home', label: 'Home', path: '/' },
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'plans', label: 'Plans', path: '/plans' },
    { key: 'wallet', label: 'Wallet', path: '/wallet' }
  ];

  const handleSectionClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-center gap-4">
        {sections.map((section) => (
          <Button
            key={section.key}
            variant={location.pathname === section.path ? 'default' : 'ghost'}
            onClick={() => handleSectionClick(section.path)}
            size="sm"
          >
            {section.label}
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
