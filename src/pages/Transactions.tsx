// src/pages/TransactionsFirebase.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Download, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Transaction {
  id: string;
  userEmail: string;
  type: string;
  amount_usd?: number;
  amount?: number; // for withdrawals
  amountCrypto?: number;
  currency?: string;
  createdAt: any; // Firestore Timestamp
  status: string;
  note?: string;
  txHash?: string;
  card?: { last4: string; expiry: string };
  bank?: { name: string; number: string; accountName: string };
}

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'crypto';

const TransactionsFirebase = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Community group links
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/your-group-link';
  const TELEGRAM_GROUP_LINK = 'https://t.me/your-group-link';

  useEffect(() => {
    if (!user?.email) return;

    setLoading(true);

    const q = query(collection(db, 'transactions'), where('userEmail', '==', user.email));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data()
          })
        ) as Transaction[];

        // Sort by createdAt descending
        txs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const filteredTxs =
          filter === 'all' ? txs : txs.filter((tx) => tx.type === filter);

        setTransactions(filteredTxs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        toast.error('Failed to fetch transactions');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email, filter]);


  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="secondary">Confirmed</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Status', 'Note'];
    const csvContent = [
      headers.join(','),
      ...transactions.map((tx) => [
        new Date(tx.createdAt?.seconds * 1000).toLocaleString(),
        tx.type,
        tx.amount_usd ??
          tx.amount ??
          (tx.amountCrypto ? `${tx.amountCrypto} ${tx.currency}` : '-'),
        tx.status,
        tx.note || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Transactions exported successfully');
  };

const formatUSD = (val?: number) => {
  if (val === undefined || val === null) return '-';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

  const handleFilterChange = (value: string) => {
    setFilter(value as FilterType);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Community Group Links */}
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Join Our Community
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-700"
                onClick={() => window.open(WHATSAPP_GROUP_LINK, '_blank')}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Join WhatsApp Group
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-700"
                onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Join Telegram Group
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Stay updated with the latest news, tips, and connect with other members!
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card
                key={tx.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTx(tx)}
              >
                <CardContent className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {tx.type === 'deposit'
                          ? 'Deposit'
                          : tx.type === 'withdrawal'
                          ? 'Withdrawal'
                          : 'Crypto Payment'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt?.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {tx.amount_usd
                          ? formatUSD(tx.amount_usd)
                          : tx.amount
                          ? formatUSD(tx.amount)
                          : tx.amountCrypto
                          ? `${tx.amountCrypto} ${tx.currency}`
                          : '-'}
                    </p>
                    <div className="mt-1">{getStatusBadge(tx.status)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Transaction Modal */}
        {selectedTx && (
          <Dialog open={true} onOpenChange={() => setSelectedTx(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 p-4">
                <p>
                  <strong>Type:</strong>{' '}
                  {selectedTx.type === 'deposit'
                    ? 'Deposit'
                    : selectedTx.type === 'withdrawal'
                    ? 'Withdrawal'
                    : 'Crypto Payment'}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(selectedTx.createdAt?.seconds * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Amount:</strong>{' '}
                    {selectedTx.amount_usd
                      ? formatUSD(selectedTx.amount_usd)
                      : selectedTx.amount
                      ? formatUSD(selectedTx.amount)
                      : selectedTx.amountCrypto
                      ? `${selectedTx.amountCrypto} ${selectedTx.currency}`
                      : '-'}
                </p>
                <p>
                  <strong>Status:</strong> {selectedTx.status}
                </p>
                {selectedTx.note && (
                  <p>
                    <strong>Note:</strong> {selectedTx.note}
                  </p>
                )}
                {selectedTx.txHash && (
                  <p>
                    <strong>TxHash:</strong> {selectedTx.txHash}
                  </p>
                )}
                {selectedTx.card && (
                  <p>
                    <strong>Card:</strong> **** **** **** {selectedTx.card.last4}
                  </p>
                )}
                {selectedTx.bank && (
                  <p>
                    <strong>Bank:</strong> {selectedTx.bank.name} - {selectedTx.bank.accountName} (
                    {selectedTx.bank.number})
                  </p>
                )}
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setSelectedTx(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsFirebase;
