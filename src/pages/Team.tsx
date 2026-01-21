import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Team = () => {
  const teamMembers = [
    {
      name: 'Support Team',
      role: 'Customer Support',
      bio: 'Available 24/7 to help with your queries.',
      initials: 'ST'
    },
    {
      name: 'Technical Team',
      role: 'Platform Development',
      bio: 'Ensuring smooth operations and security.',
      initials: 'TT'
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-semibold mb-6 text-foreground">
            <span className="block font-bold">Our</span>
            <span className="block font-light italic text-primary">Team</span>
          </h1>
        </div>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.name} className="p-8 hover:scale-105 transition-transform duration-300">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-6 bg-primary">
                    <AvatarFallback className="text-primary-foreground text-lg font-medium">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="text-xl font-medium mb-2">
                    {member.name}
                  </h3>
                  
                  <p className="text-primary text-sm uppercase tracking-wider mb-4">
                    {member.role}
                  </p>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Team;
