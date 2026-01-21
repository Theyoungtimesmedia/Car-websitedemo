import { Card } from '@/components/ui/card';

const About = () => {
  const stats = [
    { label: 'Total Users', value: '10,000+', unit: 'Users' },
    { label: 'Total Payouts', value: '$500K+', unit: 'Paid' },
    { label: 'Success Rate', value: '99', unit: '%' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-semibold mb-6 text-foreground">
            <span className="block font-bold">About</span>
            <span className="block font-light italic text-primary">Luno Rise</span>
          </h1>
        </div>

        <section className="mb-20">
          <h2 className="text-4xl font-light mb-8 text-center text-foreground">
            Our Vision
          </h2>
          <div className="text-center space-y-4">
            <div className="space-y-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              <p>Empowering individuals to grow their wealth through smart investments.</p>
              <p className="font-medium text-foreground">Secure. Reliable. Profitable.</p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-8 text-center">
                <h3 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">
                  {stat.label}
                </h3>
                <div className="text-4xl md:text-6xl font-light text-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-lg text-muted-foreground">{stat.unit}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
