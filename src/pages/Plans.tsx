import { useState } from 'react';
import { Lock, TrendingUp, Bell, Clock, Users, Gift, Wallet, Globe, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import PaymentModalNEKpay from '@/components/PaymentModalNEKpay';
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase';

interface Plan {
  id: string;
  name: string;
  deposit_usd: number;
  payout_per_drop_usd: number;
  drops_count: number;
  total_return_usd: number;
  is_locked: boolean;
  sort_order: number;
}

// Updated plans based on requirements
const INVESTMENT_PLANS: Plan[] = [
  {
    id: 'plan-5',
    name: '$5 Plan',
    deposit_usd: 500, // in cents
    payout_per_drop_usd: 50, // $0.5 daily in cents
    drops_count: 30,
    total_return_usd: 1500, // $0.5 × 30 = $15
    is_locked: false,
    sort_order: 1
  },
  {
    id: 'plan-10',
    name: '$10 Plan',
    deposit_usd: 1000, // in cents
    payout_per_drop_usd: 100, // $1 daily in cents
    drops_count: 31,
    total_return_usd: 3100, // $1 × 31 = $31
    is_locked: false,
    sort_order: 2
  },
  {
    id: 'plan-25',
    name: '$25 Plan',
    deposit_usd: 2500, // in cents
    payout_per_drop_usd: 250, // $2.5 daily in cents
    drops_count: 32,
    total_return_usd: 8000, // $2.5 × 32 = $80
    is_locked: false,
    sort_order: 3
  },
  {
    id: 'plan-50',
    name: '$50 Plan',
    deposit_usd: 5000, // in cents
    payout_per_drop_usd: 550, // $5.5 daily in cents
    drops_count: 33,
    total_return_usd: 18150, // $5.5 × 33 = $181.50
    is_locked: false,
    sort_order: 4
  },
  {
    id: 'plan-120',
    name: '$120 Plan',
    deposit_usd: 12000, // in cents
    payout_per_drop_usd: 1300, // $13 daily in cents
    drops_count: 35,
    total_return_usd: 45500, // $13 × 35 = $455
    is_locked: true,
    sort_order: 5
  },
  {
    id: 'plan-250',
    name: '$250 Plan',
    deposit_usd: 25000, // in cents
    payout_per_drop_usd: 2800, // $28 daily in cents
    drops_count: 35,
    total_return_usd: 98000, // $28 × 35 = $980
    is_locked: true,
    sort_order: 6
  }
];

const Plans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatUSD = (cents: number) => `$${(cents / 100).toFixed(0)}`;
  const formatDecimal = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getReturnPercentage = (deposit: number, totalReturn: number) => {
    return Math.round(((totalReturn - deposit) / deposit) * 100);
  };

  const handleInvestClick = (plan: Plan) => {
    if (plan.is_locked) {
      toast.info('This plan will be available soon. Get notified when it launches!');
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleNotifyMe = (plan: Plan) => {
    toast.success('You will be notified when this plan becomes available!');
  };

  const handleDownloadApp = () => {
    toast.info('App download coming soon!');
  };

  // Handle successful payment from NEKpay
// Replace your handlePaymentSuccess function with this:

const handlePaymentSuccess = async (orderData) => {
  if (!selectedPlan) {
    console.error('❌ No plan selected');
    return;
  }

  console.log('🎯 handlePaymentSuccess received data:', orderData);
  console.log('👤 Current user:', user);

  // Check if user is authenticated
  if (!user || !user.uid) {
    console.error('❌ User not authenticated!');
    toast.error('Please log in to complete your investment.');
    return;
  }

  try {
    // FIXED: Ensure all fields have values, never undefined
    const transactionData = {
      // User info - MUST have userId for security rules
      userEmail: user.email || 'anonymous',
      userId: user.uid,
      
      // Plan info
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      
      // Amount (convert cents to dollars)
      amount_usd: selectedPlan.deposit_usd / 100,
      
      // Transaction info
      type: 'deposit',
      method: 'NEKpay',
      status: 'success',
      
      // Order IDs - FIXED: All guaranteed to be strings
      orderId: String(orderData.mchOrderNo || ''),
      mchOrderNo: String(orderData.mchOrderNo || ''),
      payOrderId: String(orderData.payOrderId || ''),
      platformOrderNo: String(orderData.platformOrderNo || orderData.payOrderId || ''),
      
      // Customer info from payment
      customerName: String(orderData.customerName || ''),
      customerEmail: String(orderData.customerEmail || user?.email || ''),
      customerPhone: String(orderData.customerPhone || ''),
      
      // Payment details
      currency: String(orderData.currency || 'USD'),
      paymentState: Number(orderData.state || 2),
      
      // Timestamp
      createdAt: serverTimestamp()
    };

    console.log('💾 Saving transaction to Firebase:', transactionData);

    // Save transaction
    const txRef = await addDoc(collection(db, 'transactions'), transactionData);
    console.log('✅ Transaction saved with ID:', txRef.id);

    // FIXED: Investment data with all fields defined
    const investmentData = {
      // User info - MUST have userId for security rules
      userEmail: user.email || 'anonymous',
      userId: user.uid,
      
      // Plan info
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      
      // Link to transaction
      transactionId: txRef.id,
      orderId: String(orderData.mchOrderNo || ''),
      
      // Investment amounts (convert cents to dollars)
      deposit_usd: selectedPlan.deposit_usd / 100,
      payout_per_drop_usd: selectedPlan.payout_per_drop_usd / 100,
      drops_count: selectedPlan.drops_count,
      total_return_usd: selectedPlan.total_return_usd / 100,
      
      // Status tracking
      drops_received: 0,
      status: 'active',
      
      // Next drop scheduled for 22 hours from now
      nextDropAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      
      // Timestamps
      createdAt: serverTimestamp(),
      startDate: serverTimestamp()
    };

    console.log('💼 Saving investment to Firebase:', investmentData);

    // Save investment
    const investmentRef = await addDoc(collection(db, 'investments'), investmentData);
    console.log('✅ Investment saved with ID:', investmentRef.id);

    // Success!
    toast.success('Investment created successfully! 🎉');
    
    // Navigate to transactions after 2 seconds
    setTimeout(() => {
      navigate('/transactions');
    }, 2000);

  } catch (error) {
    console.error('❌ FIREBASE ERROR:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    toast.error(`Payment succeeded but failed to save: ${error.message}. Please contact support with Order ID: ${orderData.mchOrderNo}`);
  }
};

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="p-6 pt-12">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground mb-2">Investment Plans</h1>
            </div>
            <p className="text-muted-foreground">
              Choose a plan and start earning daily returns on your investment
            </p>
          </div>

          {/* Welcome Bonus Notice */}
          <div className="mb-4 bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-success">Welcome Bonus</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              New users receive a <strong className="text-success">$1 welcome bonus</strong> credited to their wallet upon sign up!
            </p>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Income Cycle</span>
              </div>
              <p className="text-sm font-bold text-foreground">Every 22 Hours</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Min. Withdrawal</span>
              </div>
              <p className="text-sm font-bold text-foreground">$2</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Withdrawal Time</span>
              </div>
              <p className="text-sm font-bold text-foreground">9AM - 6PM Daily</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Withdrawal Fee</span>
              </div>
              <p className="text-sm font-bold text-foreground">15% Local / Free USDT</p>
            </div>
          </div>

          {/* Referral Program */}
          <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Referral Program</h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/20 text-primary">Level 1: 20%</Badge>
              <Badge variant="secondary" className="bg-primary/15 text-primary">Level 2: 3%</Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary">Level 3: 2%</Badge>
            </div>
          </div>

          {/* Available Countries */}
          <div className="mb-6 bg-info/10 border border-info/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-info" />
              <h3 className="font-semibold text-info">Available Countries</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Nigeria', 'Kenya', 'Uganda', 'South Africa', 'Ghana'].map((country) => (
                <Badge key={country} variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                  {country}
                </Badge>
              ))}
            </div>
          </div>

          {/* App Download Button */}
          <div className="mb-6">
            <Button 
              onClick={handleDownloadApp}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
            >
              <Download className="mr-2 h-5 w-5" />
              Download App
            </Button>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-4">Choose Your Plan</h2>

          <div className="grid gap-4">
            {INVESTMENT_PLANS.map((plan) => {
              const returnPercentage = getReturnPercentage(plan.deposit_usd, plan.total_return_usd);
              const cardColors = [
                'bg-gradient-to-br from-blue-500 to-blue-600',
                'bg-gradient-to-br from-green-500 to-green-600', 
                'bg-gradient-to-br from-purple-500 to-purple-600',
                'bg-gradient-to-br from-orange-500 to-orange-600',
                'bg-gradient-to-br from-pink-500 to-pink-600',
                'bg-gradient-to-br from-cyan-500 to-cyan-600'
              ];
              const colorIndex = INVESTMENT_PLANS.indexOf(plan);
              const cardColor = plan.is_locked 
                ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                : cardColors[colorIndex % cardColors.length];
              
              return (
                <Card key={plan.id} className={`relative overflow-hidden ${cardColor} text-white border shadow-sm hover:shadow-md transition-all duration-200`}>
                  {plan.is_locked && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="text-xs px-2 py-1 bg-white/20 text-white">
                        <Lock className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4 text-center">
                    <div className="flex flex-col items-center">
                      <CardTitle className="text-lg font-bold text-white">{plan.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs bg-white/20 text-white border-white/30">
                        +{returnPercentage}% Return
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-xs text-white/70 mb-1">Deposit Amount</p>
                        <p className="text-xl font-bold text-white">
                          {formatUSD(plan.deposit_usd)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/70 mb-1">Total Return</p>
                        <p className="text-xl font-bold text-green-300">
                          {formatDecimal(plan.total_return_usd)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/20">
                      <div className="text-center">
                        <p className="text-xs text-white/70 mb-1">Daily Earnings</p>
                        <p className="text-sm font-semibold text-white">
                          {formatDecimal(plan.payout_per_drop_usd)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/70 mb-1">Duration</p>
                        <p className="text-sm font-semibold text-white">
                          {plan.drops_count} days
                        </p>
                      </div>
                    </div>

                    <div className="pt-3">
                      {plan.is_locked ? (
                        <Button
                          className="w-full h-11 bg-white/10 text-white border-white/20 hover:bg-white/15"
                          variant="outline"
                          size="default"
                          onClick={() => handleNotifyMe(plan)}
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          Notify Me
                        </Button>
                      ) : (
                        <Button
                          className="w-full h-11 bg-white/20 text-white border-white/30 hover:bg-white/30"
                          variant="outline"
                          size="default"
                          onClick={() => handleInvestClick(plan)}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Invest Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* NEKpay Payment Modal - NO merchantId/merchantKey needed anymore! */}
        {selectedPlan && (
          <PaymentModalNEKpay
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
            }}
            plan={{
              ...selectedPlan,
              deposit_usd: selectedPlan.deposit_usd / 100, // Convert cents to dollars
              payout_per_drop_usd: selectedPlan.payout_per_drop_usd / 100,
              total_return_usd: selectedPlan.total_return_usd / 100
            }}
            userEmail={user?.email}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </Layout>
  );
};

export default Plans;