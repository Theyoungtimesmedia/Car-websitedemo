import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Bell, LogOut, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/integrations/firebase';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  balance: number;
}

interface WalletData {
  available_cents: number;
  pending_cents: number;
  total_earned_cents: number;
}

interface Investment {
  id: string;
  planId: string;
  planName: string;
  deposit_usd: number;
  payout_per_drop_usd: number;
  drops_count: number;
  total_return_usd: number;
  status: string;
  createdAt: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const data = userSnap.docs[0].data() as any;
          setUserData({
            name: data.name || 'User',
            email: data.email,
            balance: data.balance || 0,
          });
        }

        const walletQuery = query(collection(db, 'wallets'), where('user_id', '==', user.uid));
        const walletSnap = await getDocs(walletQuery);
        if (!walletSnap.empty) {
          setWallet(walletSnap.docs[0].data() as WalletData);
        }

        const investQuery = query(collection(db, 'investments'), where('userEmail', '==', user.email));
        const investSnap = await getDocs(investQuery);
        const invs: Investment[] = investSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
        invs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setInvestments(invs);

      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const formatUSD = (amount: number) =>
    `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-[2rem]">
          <div className="flex justify-between items-start mb-6 animate-fade-in">
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium">Welcome back</p>
              <h1 className="text-2xl font-bold mt-1">{userData?.name || 'User'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Balance Card */}
          <Card className="bg-white/15 backdrop-blur-xl border-white/20 shadow-lg animate-slide-up">
            <CardContent className="p-5">
              <p className="text-primary-foreground/70 text-sm mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-primary-foreground mb-4">
                {formatUSD(userData?.balance || 0)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/plans')}
                  className="bg-white text-primary hover:bg-white/90 font-semibold h-11 rounded-xl"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Funds
                </Button>
                <Button 
                  onClick={() => navigate('/wallet')}
                  className="bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30 font-semibold h-11 rounded-xl"
                  variant="outline"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Stats */}
        <div className="px-6 -mt-2">
          <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Card className="bg-card border-0 shadow-card hover-lift">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">
                  {userData ? formatUSD(userData.balance) : '$0.00'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Available</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-0 shadow-card hover-lift">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-warning">
                  {wallet ? formatUSD(wallet.pending_cents / 100) : '$0.00'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-0 shadow-card hover-lift">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-info">
                  {wallet ? formatUSD(wallet.total_earned_cents / 100) : '$0.00'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Earned</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Investments */}
        <div className="px-6 mt-6 pb-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Active Investments</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary text-sm"
              onClick={() => navigate('/plans')}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {investments.length === 0 ? (
              <Card className="bg-card border-0 shadow-soft animate-fade-in">
                <CardContent className="py-10 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No active investments yet</p>
                  <Button onClick={() => navigate('/plans')} className="bg-gradient-primary text-primary-foreground">
                    Start Investing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              investments.slice(0, 3).map((inv, index) => (
                <Card 
                  key={inv.id} 
                  className="bg-card border-0 shadow-soft hover-lift cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => { setSelectedInvestment(inv); setModalOpen(true); }}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{inv.planName}</p>
                        <p className="text-sm text-muted-foreground">
                          Deposited: {formatUSD(inv.deposit_usd)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={
                          inv.status === 'active' 
                            ? 'bg-success/10 text-success border-success/20' 
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {inv.status}
                      </Badge>
                      <p className="text-sm font-semibold text-success mt-1">
                        +{formatUSD(inv.total_return_usd)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Investment Detail Modal */}
        <Dialog open={modalOpen} onOpenChange={() => setModalOpen(false)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Investment Details</DialogTitle>
            </DialogHeader>
            {selectedInvestment && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-semibold text-foreground">{selectedInvestment.planName}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="font-semibold text-foreground">{formatUSD(selectedInvestment.deposit_usd)}</p>
                  </div>
                  <div className="bg-success/10 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Daily Payout</p>
                    <p className="font-semibold text-success">{formatUSD(selectedInvestment.payout_per_drop_usd)}</p>
                  </div>
                  <div className="bg-success/10 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className="font-semibold text-success">{formatUSD(selectedInvestment.total_return_usd)}</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-sm font-medium">{selectedInvestment.drops_count} days</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full" 
                      style={{ width: '30%' }} 
                    />
                  </div>
                </div>
                <Button 
                  className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-xl" 
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Dashboard;
