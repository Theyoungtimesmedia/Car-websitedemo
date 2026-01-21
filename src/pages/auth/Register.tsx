import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { CountrySelector } from '@/components/CountrySelector';
import { auth, db } from '@/integrations/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, updateDoc, increment } from 'firebase/firestore';

// Simple 8-character referral code generator
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

// Registration bonus amount in cents ($1)
const REGISTRATION_BONUS_CENTS = 100;

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    referralCode: ''
  });

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) setFormData(prev => ({ ...prev, referralCode: refParam }));
  }, [searchParams]);

  const handleReferralBonus = async (referralCode: string) => {
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    snapshot.forEach(async docSnap => {
      await updateDoc(doc(db, 'users', docSnap.id), { balance: increment(1000) });
    });
  };

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country) {
      toast.error('Please select your country');
      return;
    }
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Check if phone number already exists
      const phoneQuery = query(collection(db, 'users'), where('phone', '==', formData.phone));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        toast.error('This phone number is already registered');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      const myReferralCode = generateReferralCode();
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        balance: REGISTRATION_BONUS_CENTS / 100, // $1 registration bonus (stored as dollars)
        referralCode: myReferralCode,
        referrerCode: formData.referralCode || null,
        createdAt: new Date()
      });

      if (formData.referralCode) await handleReferralBonus(formData.referralCode);

      toast.success('Account created! You received a $1 registration bonus. Check your email for verification.');
      navigate('/auth/login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBottomNav={false}>
      <div className="relative min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        {/* Spinner Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
            <span className="ml-4 text-white text-lg">Loading...</span>
          </div>
        )}

        <Card className="w-full max-w-md z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Join Luno Rise and start earning today</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Registration Bonus Notice */}
            <div className="mb-4 bg-success/10 border border-success/20 rounded-lg p-3">
              <p className="text-sm text-success font-medium">
                🎉 Get <strong>$1 registration bonus</strong> when you sign up!
              </p>
            </div>

            <form onSubmit={handlePhoneSignUp} className="space-y-4">
              <div>
                <Label>Country</Label>
                <CountrySelector
                  value={formData.country}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} 
                  placeholder="Enter your phone number"
                  required 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                  placeholder="Enter your email"
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email is used for verification and password recovery
                </p>
              </div>
              <div>
                <Label>Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} 
                  placeholder="Create a password"
                  required 
                  minLength={6} 
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} 
                  placeholder="Confirm your password"
                  required 
                  minLength={6} 
                />
              </div>

              <Button type="submit" className="w-full" variant="primary_gradient" disabled={loading || !formData.country}>
                {loading ? 'Creating Account...' : 'Sign Up & Get $1 Bonus'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
