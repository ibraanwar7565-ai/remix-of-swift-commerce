import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Lock, Eye, EyeOff, LogIn, Phone, Briefcase, User, Sparkles, KeyRound, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import heroSlide1 from '@/assets/hero-slide-1.jpg';

type Step = 'auth' | 'phone-otp' | 'complete-profile' | 'staff-login' | 'forgot-password' | 'forgot-otp' | 'set-new-password';

const Auth = () => {
  const [step, setStep] = useState<Step>('auth');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  const { user, sendPhoneOtp, verifyPhoneOtp, signInWithPassword, updateProfile } = useAuth();
  const { isAdmin, isRider, roles, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const isInventoryManager = roles.includes('inventory_manager');

  useEffect(() => {
    if (user && !roleLoading && step !== 'complete-profile') {
      if (isAdmin) navigate('/admin');
      else if (isInventoryManager) navigate('/admin/inventory');
      else if (isRider) navigate('/rider');
      else navigate('/store');
    }
  }, [user, isAdmin, isRider, isInventoryManager, roleLoading, navigate, step]);

  // OTP countdown timer
  useEffect(() => {
    if (step === 'phone-otp' || step === 'forgot-otp') {
      setOtpTimer(300); // 5 minutes in seconds
    } else {
      setOtpTimer(0);
    }
  }, [step]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('254')) return `+${digits}`;
    if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
    if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`;
    return `+${digits}`;
  };

  const handleSendPhoneOtp = useCallback(async () => {
    const formatted = formatPhone(phone);
    if (!/^\+254\d{9}$/.test(formatted)) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    // Optimistic: show OTP input immediately while SMS sends in background
    setPhone(formatted);
    setStep('phone-otp');
    sendPhoneOtp(formatted).then(({ error }) => {
      if (error) {
        toast.error(error);
        setStep('auth');
      } else {
        toast.success('Verification code sent via SMS! 📱');
      }
    });
  }, [phone, sendPhoneOtp]);

  const handleVerifyPhoneOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const { error, isNewUser } = await verifyPhoneOtp(phone, otpCode);
      if (error) {
        toast.error(error);
      } else if (isNewUser) {
        setStep('complete-profile');
        toast.success('Phone verified! Let\'s set up your profile 🎉');
      } else {
        toast.success('Welcome back to HALLOFRESH! 🎉');
      }
    } finally {
      setIsLoading(false);
    }
  }, [phone, otpCode, verifyPhoneOtp]);

  const handleCompleteProfile = useCallback(async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.error('Please enter your name');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await updateProfile({ full_name: trimmedName });
      if (error) {
        toast.error('Failed to save profile. Please try again.');
      } else {
        toast.success(`Welcome, ${trimmedName}! 🎉`);
        navigate('/store');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fullName, updateProfile, navigate]);

  const handleStaffLogin = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signInWithPassword(trimmed, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome back! 🎉');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signInWithPassword]);

  const handleForgotSendOtp = useCallback(async () => {
    const trimmed = resetEmail.trim().toLowerCase();
    if (!trimmed) {
      toast.error('Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      const res = await supabase.functions.invoke('staff-password-reset', {
        body: { action: 'send-otp', email: trimmed },
      });
      const data = res.data as any;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      
      setMaskedPhone(data.maskedPhone);
      setResetPhone(data.phone);
      setStep('forgot-otp');
      toast.success('Reset code sent to your registered phone! 📱');
    } finally {
      setIsLoading(false);
    }
  }, [resetEmail]);

  const handleForgotVerifyAndReset = useCallback(async () => {
    if (resetOtp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setStep('set-new-password');
  }, [resetOtp]);

  const handleSetNewPassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const res = await supabase.functions.invoke('staff-password-reset', {
        body: {
          action: 'reset-password',
          email: resetEmail.trim().toLowerCase(),
          code: resetOtp,
          newPassword,
        },
      });
      const data = res.data as any;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      toast.success('Password reset successfully! Please sign in with your new password.');
      setStep('staff-login');
      setEmail(resetEmail);
      setPassword('');
      setResetEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  }, [resetEmail, resetOtp, newPassword, confirmPassword]);

  const goBack = () => {
    if (step === 'phone-otp') { setStep('auth'); setOtpCode(''); }
    else if (step === 'complete-profile') { /* Can't go back — already verified */ }
    else if (step === 'staff-login') { setStep('auth'); setEmail(''); setPassword(''); }
    else if (step === 'forgot-password') { setStep('staff-login'); setResetEmail(''); }
    else if (step === 'forgot-otp') { setStep('forgot-password'); setResetOtp(''); }
    else if (step === 'set-new-password') { setStep('forgot-otp'); setNewPassword(''); setConfirmPassword(''); }
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={heroSlide1} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(150,30%,6%)]/90 to-[hsl(130,50%,20%)]/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            src={logo} alt="HALLOFRESH" className="h-24 w-24 object-contain mb-6" />
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-4xl font-extrabold text-center mb-4">Welcome to<br />HALLOFRESH</motion.h2>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-white/70 text-center max-w-sm">
            Fresh groceries, gourmet meals, and daily essentials delivered to your doorstep in minutes.
          </motion.p>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex gap-6 mt-10 text-sm text-white/60">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /> Fast delivery</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /> 100% Fresh</span>
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 bg-background flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full"
            disabled={step === 'complete-profile'}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="HALLOFRESH" className="h-8 w-8 object-contain" />
            <span className="font-bold text-sm text-foreground">HALLOFRESH</span>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 'auth' ? (
                  <>
                    <div className="mb-6 text-center">
                      <div className="lg:hidden mb-4">
                        <img src={logo} alt="" className="h-16 w-16 object-contain mx-auto" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-1">Sign In</h1>
                      <p className="text-muted-foreground text-sm">Quick login with your phone number</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="phone" type="tel" inputMode="tel" placeholder="0712 345 678"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-4"
                            value={phone} onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendPhoneOtp()} />
                        </div>
                        <p className="text-xs text-muted-foreground">We'll send a 6-digit code via SMS</p>
                      </div>

                      <Button
                        className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button"
                        onClick={handleSendPhoneOtp}
                        disabled={isLoading || !phone.trim()}
                      >
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending code...</> : 'Send Verification Code'}
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                      </div>

                      <Button variant="outline" className="w-full h-12 rounded-2xl text-base font-medium" onClick={() => navigate('/store')}>
                        Browse as Guest
                      </Button>

                      <div className="text-center pt-4">
                        <Button variant="link" className="text-muted-foreground text-xs gap-1.5" onClick={() => setStep('staff-login')}>
                          <Briefcase className="h-3.5 w-3.5" /> Staff Login
                        </Button>
                      </div>
                    </div>
                  </>

                ) : step === 'phone-otp' ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-2">Verify Code</h1>
                      <p className="text-muted-foreground">We sent a 6-digit code to <span className="font-semibold text-foreground">{phone}</span></p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
                        <Input id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                          className="h-14 rounded-xl bg-secondary border-0 text-2xl text-center tracking-[0.5em] font-mono"
                          value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={(e) => e.key === 'Enter' && handleVerifyPhoneOtp()} autoFocus />
                      </div>
                      <Button className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button mt-2"
                        onClick={handleVerifyPhoneOtp} disabled={isLoading || otpCode.length !== 6}>
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</> : 'Verify & Sign In'}
                      </Button>
                      <div className="text-center pt-2">
                        <p className="text-muted-foreground text-sm">Didn't receive the code?</p>
                        <Button variant="link" className="text-primary font-semibold" onClick={handleSendPhoneOtp} disabled={isLoading}>Resend Code</Button>
                      </div>
                    </div>
                  </>

                ) : step === 'complete-profile' ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-2">Almost There!</h1>
                      <p className="text-muted-foreground">Tell us your name so we know what to call you</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">Your Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="fullName" type="text" placeholder="e.g. John Kamau"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-4"
                            value={fullName} onChange={(e) => setFullName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCompleteProfile()} autoFocus />
                        </div>
                      </div>
                      <Button className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button mt-2"
                        onClick={handleCompleteProfile} disabled={isLoading || !fullName.trim()}>
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</> : 'Get Started 🚀'}
                      </Button>
                    </div>
                  </>

                ) : step === 'staff-login' ? (
                  <>
                    <div className="mb-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-1">Staff Login</h1>
                      <p className="text-muted-foreground text-sm">For admins, riders & team members only</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="email" type="email" inputMode="email" placeholder="you@example.com"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-4"
                            value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-12"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button mt-2"
                        onClick={handleStaffLogin}
                        disabled={isLoading || !email.trim() || !password}
                      >
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing in...</> : <><LogIn className="mr-2 h-5 w-5" />Sign In</>}
                      </Button>

                      <div className="text-center pt-1">
                        <Button variant="link" className="text-primary text-sm font-medium" onClick={() => { setStep('forgot-password'); setResetEmail(email); }}>
                          Forgot Password?
                        </Button>
                      </div>

                      <p className="text-xs text-center text-muted-foreground pt-1">
                        Staff accounts are created by your administrator. Contact your admin if you don't have credentials.
                      </p>
                    </div>
                  </>

                ) : step === 'forgot-password' ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-2">Reset Password</h1>
                      <p className="text-muted-foreground text-sm">Enter your staff email and we'll send a verification code to your registered phone number</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail" className="text-sm font-medium">Staff Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="resetEmail" type="email" inputMode="email" placeholder="you@example.com"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-4"
                            value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleForgotSendOtp()} autoFocus />
                        </div>
                      </div>
                      <Button className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button"
                        onClick={handleForgotSendOtp} disabled={isLoading || !resetEmail.trim()}>
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending code...</> : 'Send Reset Code'}
                      </Button>
                    </div>
                  </>

                ) : step === 'forgot-otp' ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-2">Enter Reset Code</h1>
                      <p className="text-muted-foreground">We sent a 6-digit code to <span className="font-semibold text-foreground">{maskedPhone}</span></p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetOtp" className="text-sm font-medium">Verification Code</Label>
                        <Input id="resetOtp" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                          className="h-14 rounded-xl bg-secondary border-0 text-2xl text-center tracking-[0.5em] font-mono"
                          value={resetOtp} onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={(e) => e.key === 'Enter' && handleForgotVerifyAndReset()} autoFocus />
                      </div>
                      <Button className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button mt-2"
                        onClick={handleForgotVerifyAndReset} disabled={resetOtp.length !== 6}>
                        Continue
                      </Button>
                      <div className="text-center pt-2">
                        <p className="text-muted-foreground text-sm">Didn't receive the code?</p>
                        <Button variant="link" className="text-primary font-semibold" onClick={handleForgotSendOtp} disabled={isLoading}>Resend Code</Button>
                      </div>
                    </div>
                  </>

                ) : step === 'set-new-password' ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-foreground mb-2">Set New Password</h1>
                      <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} placeholder="Min 6 characters"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-12"
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input id="confirmPassword" type={showNewPassword ? 'text' : 'password'} placeholder="Re-enter password"
                            className="h-14 rounded-xl bg-secondary border-0 text-lg pl-11 pr-4"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSetNewPassword()} />
                        </div>
                      </div>
                      <Button className="w-full h-14 rounded-2xl text-lg font-semibold shadow-button mt-2"
                        onClick={handleSetNewPassword} disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}>
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Resetting...</> : 'Reset Password'}
                      </Button>
                    </div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">By continuing, you agree to our <button className="text-primary hover:underline">Terms</button> & <button className="text-primary hover:underline">Privacy Policy</button></p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
