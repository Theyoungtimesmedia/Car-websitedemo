import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-primary">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-semibold mb-8 text-primary-foreground">
          <span className="block font-bold">Luno Rise</span>
          <span className="block font-light italic text-3xl mt-2">Investment Platform</span>
        </h1>
        <p className="text-lg text-primary-foreground/80 mb-8">
          Start earning daily returns on your investments
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/auth/login')} variant="secondary" size="lg">
            Sign In
          </Button>
          <Button onClick={() => navigate('/auth/register')} variant="default" size="lg">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
