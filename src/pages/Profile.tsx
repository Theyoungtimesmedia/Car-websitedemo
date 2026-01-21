import { useState, useEffect } from 'react';
import { Edit2, LogOut, Copy, User, Shield, HelpCircle, Download, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { auth, db } from '@/integrations/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import Layout from '@/components/Layout';
import { CountrySelector } from '@/components/CountrySelector';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserData {
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  referralCode?: string;
  balance: number;
  createdAt?: any;
}

interface WalletData {
  available_cents: number;
  pending_cents: number;
  total_earned_cents: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatUSD = (amount: number) =>
    `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const data = userSnap.docs[0].data();
          setUserData({
            name: data.name || 'N/A',
            email: data.email,
            phone: data.phone || 'N/A',
            country: data.country || 'N/A',
            city: data.city || 'N/A',
            address: data.address || 'N/A',
            referralCode: data.referralCode || 'N/A',
            balance: data.balance || 0,
            createdAt: data.createdAt,
          });
        }

        const walletQuery = query(collection(db, 'wallets'), where('user_id', '==', user.uid));
        const walletSnap = await getDocs(walletQuery);
        if (!walletSnap.empty) {
          setWallet(walletSnap.docs[0].data() as WalletData);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!userData || !user) return;

    setSaving(true);
    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        const docRef = doc(db, 'users', userSnap.docs[0].id);
        await updateDoc(docRef, {
          phone: userData.phone === 'N/A' ? '' : userData.phone,
          country: userData.country === 'N/A' ? '' : userData.country,
          city: userData.city === 'N/A' ? '' : userData.city,
          address: userData.address === 'N/A' ? '' : userData.address,
        });
        toast.success('Profile updated successfully');
        setShowEditModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  const copyReferralCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      toast.success('Referral code copied!');
    }
  };

  const getMemberSince = () => {
    if (userData?.createdAt?.seconds) {
      const date = new Date(userData.createdAt.seconds * 1000);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    return 'N/A';
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

  const menuItems = [
    {
      icon: User,
      title: 'Personal Information',
      subtitle: 'Update your details',
      color: 'bg-info/10 text-info',
      onClick: () => setShowEditModal(true),
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      subtitle: 'Password, 2FA settings',
      color: 'bg-warning/10 text-warning',
      onClick: () => toast.info('Coming soon'),
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'About us',
      color: 'bg-secondary/10 text-secondary',
      onClick: () => toast.info('Contact support@lunorise.com'),
    },
    {
      icon: Download,
      title: 'Download',
      subtitle: 'Download app',
      color: 'bg-secondary/10 text-secondary',
      onClick: () => toast.info('App download coming soon!'),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-6 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-primary animate-fade-in">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="px-6 mb-4">
          <Card className="bg-gradient-primary border-0 shadow-lg overflow-hidden animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-primary-foreground">{userData?.name}</h2>
                  <p className="text-primary-foreground/70 text-sm">ID: {user?.uid?.slice(0, 8)}</p>
                  <p className="text-primary-foreground/60 text-xs">Member since {getMemberSince()}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground/80 hover:bg-white/10 rounded-full"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-foreground">0</p>
                  <p className="text-primary-foreground/60 text-xs">Equipment</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-foreground">0</p>
                  <p className="text-primary-foreground/60 text-xs">Shares</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-foreground">1mo</p>
                  <p className="text-primary-foreground/60 text-xs">Experience</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Card */}
        <div className="px-6 mb-6">
          <Card className="bg-gradient-pink border-0 shadow-lg overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-primary-foreground mb-2">Invite Friends & Earn</h3>
              <p className="text-primary-foreground/70 text-sm mb-4">Share your referral code and earn rewards</p>
              
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-primary-foreground/70 text-xs mb-1">Your Invitation Code</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-primary-foreground tracking-wider">
                    {userData?.referralCode || 'N/A'}
                  </p>
                  <Button 
                    size="icon"
                    variant="ghost"
                    className="text-primary-foreground hover:bg-white/20 rounded-full"
                    onClick={copyReferralCode}
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Section */}
        <div className="px-6">
          <h3 className="text-lg font-bold text-foreground mb-3">Account</h3>
          <Card className="bg-card border-0 shadow-soft overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-0">
              {menuItems.map((item, index) => (
                <button
                  key={item.title}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sign Out Button */}
        <div className="px-6 mt-6">
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl font-semibold animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <LogOut className="mr-2 h-5 w-5" /> Sign Out
          </Button>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <Input 
                  value={userData?.phone || ''} 
                  onChange={(e) => setUserData({ ...userData!, phone: e.target.value })}
                  className="mt-1 h-12 rounded-xl bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Country</Label>
                <div className="mt-1">
                  <CountrySelector 
                    value={userData?.country || ''} 
                    onValueChange={(val) => setUserData({ ...userData!, country: val })} 
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-xl"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Profile;
