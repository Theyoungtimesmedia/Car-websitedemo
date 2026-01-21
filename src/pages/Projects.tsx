import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Projects = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground">
            Our <span className="text-primary">Plans</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto">
            Choose from our variety of investment plans
          </p>
        </div>

        <div className="text-center">
          <Card className="p-8 max-w-md mx-auto">
            <Badge className="mb-4">Coming Soon</Badge>
            <p className="text-muted-foreground">
              More investment opportunities will be available soon.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Projects;
