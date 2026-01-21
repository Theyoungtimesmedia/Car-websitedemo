import { useState, useEffect } from 'react';
import { db } from '@/integrations/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, Timestamp, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, Loader2, TrendingUp, Wallet as WalletIcon, History } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  createdAt: Timestamp;
  status: string;
  note?: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);

    const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
    const unsubscribeUser = onSnapshot(userQuery, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setBalance(data.balance || 0);
      }
    });

    const txQuery = query(
      collection(db, 'transactions'),
      where('userEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeTx = onSnapshot(txQuery, (snap) => {
      const txs: Transaction[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
      setTransactions(txs);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTx();
    };
  }, [user?.email]);

  const formatUSD = (amount: number) =>
    `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const handleDeposit = async (amount: number) => {
    if (!user?.email) return;
    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
      const snap = await getDocs(userQuery);
      if (!snap.empty) {
        const userRef = snap.docs[0].ref;
        const newBalance = (snap.docs[0].data().balance || 0) + amount;
        await updateDoc(userRef, { balance: newBalance });
        await addDoc(collection(db, 'transactions'), {
          userEmail: user.email,
          type: 'deposit',
          amount,
          createdAt: Timestamp.now(),
          status: 'success',
          note: 'Card deposit'
        });
        toast.success('Deposit successful');
        setShowDepositModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Deposit failed');
    }
  };

  const handleWithdraw = async (amount: number, bankName: string, accountNumber: string, accountName: string) => {
    if (!user?.email) return;
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
      const snap = await getDocs(userQuery);
      if (!snap.empty) {
        const userRef = snap.docs[0].ref;
        const newBalance = (snap.docs[0].data().balance || 0) - amount;
        await updateDoc(userRef, { balance: newBalance });
        await addDoc(collection(db, 'transactions'), {
          userEmail: user.email,
          type: 'withdrawal',
          amount,
          createdAt: Timestamp.now(),
          status: 'success',
          note: `Withdraw to ${bankName} ${accountNumber} (${accountName})`
        });
        toast.success('Withdrawal successful');
        setShowWithdrawModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Withdrawal failed');
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  };

  if (loading) {
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
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-6 pt-12 pb-6">
          <h1 className="text-2xl font-bold text-primary text-center animate-fade-in">My Wallet</h1>
          <p className="text-muted-foreground text-center mt-1 animate-fade-in">Manage your funds and transactions</p>
        </div>

        {/* Income Account Card */}
        <div className="px-6 mb-4">
          <Card className="bg-gradient-primary border-0 shadow-lg overflow-hidden animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-primary-foreground/80 font-medium">Income Account</p>
                  <p className="text-primary-foreground/60 text-sm">Main balance for transactions</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowUp className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              
              <p className="text-4xl font-bold text-primary-foreground my-4">{formatUSD(balance)}</p>
              <p className="text-primary-foreground/60 text-sm mb-4">Available for withdrawal</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setShowDepositModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 h-12 rounded-xl font-semibold"
                >
                  <ArrowDown className="mr-2 h-5 w-5" /> Add Funds
                </Button>
                <Button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 h-12 rounded-xl font-semibold"
                >
                  <ArrowUp className="mr-2 h-5 w-5" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dividend Account Card */}
        <div className="px-6 mb-6">
          <Card className="bg-gradient-blue border-0 shadow-lg overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-primary-foreground/80 font-medium">Dividend Account</p>
                  <p className="text-primary-foreground/60 text-sm">Earnings from investments</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              
              <p className="text-3xl font-bold text-primary-foreground my-4">$0.00</p>
              <p className="text-primary-foreground/60 text-sm mb-4">Investment returns</p>
              
              <Button 
                className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border-0 h-12 rounded-xl font-semibold"
                disabled
              >
                <WalletIcon className="mr-2 h-5 w-5" /> Transfer to Income
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border-0 shadow-soft hover-lift cursor-pointer animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-2">
                  <WalletIcon className="h-6 w-6 text-foreground" />
                </div>
                <p className="font-medium text-foreground">Cards</p>
              </CardContent>
            </Card>
            <Card 
              className="bg-gradient-pink border-0 shadow-soft hover-lift cursor-pointer animate-fade-in" 
              style={{ animationDelay: '0.25s' }}
              onClick={() => toast.info('Coming soon!')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🎁</span>
                </div>
                <p className="font-medium text-primary-foreground">Passcode Reward</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Transaction History</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => navigate('/transactions')}
            >
              View All
            </Button>
          </div>

          {transactions.length === 0 ? (
            <Card className="bg-card border-0 shadow-soft animate-fade-in">
              <CardContent className="py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx, index) => (
                <Card 
                  key={tx.id} 
                  className="bg-card border-0 shadow-soft animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-success/10' : 'bg-secondary/10'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDown className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowUp className="h-5 w-5 text-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.type === 'deposit' ? 'text-success' : 'text-secondary'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatUSD(tx.amount)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Deposit Modal */}
        <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add Funds</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <input
                type="number"
                placeholder="Amount ($)"
                className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                id="depositAmount"
              />
              <input
                type="text"
                placeholder="Card Number"
                maxLength={19}
                className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                onInput={(e) => {
                  const el = e.target as HTMLInputElement;
                  el.value = formatCardNumber(el.value);
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  onInput={(e) => {
                    const el = e.target as HTMLInputElement;
                    el.value = formatExpiry(el.value);
                  }}
                />
                <input
                  type="text"
                  placeholder="CVC"
                  maxLength={3}
                  className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button
                onClick={() => {
                  const amt = Number((document.getElementById('depositAmount') as HTMLInputElement).value);
                  handleDeposit(amt);
                }}
                className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-xl"
              >
                Add Funds
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Modal */}
        <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Withdraw Funds</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <input
                type="number"
                placeholder="Amount ($)"
                className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                id="withdrawAmount"
              />
              <input
                type="text"
                placeholder="Bank Name"
                className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                id="bankName"
              />
              <input
                type="text"
                placeholder="Account Number"
                className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                id="accountNumber"
              />
              <input
                type="text"
                placeholder="Account Name"
                className="w-full border border-border bg-muted/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                id="accountName"
              />
              <Button
                onClick={() => {
                  const amt = Number((document.getElementById('withdrawAmount') as HTMLInputElement).value);
                  const bank = (document.getElementById('bankName') as HTMLInputElement).value;
                  const accNum = (document.getElementById('accountNumber') as HTMLInputElement).value;
                  const accName = (document.getElementById('accountName') as HTMLInputElement).value;
                  handleWithdraw(amt, bank, accNum, accName);
                }}
                className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-xl"
              >
                Withdraw
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Wallet;
