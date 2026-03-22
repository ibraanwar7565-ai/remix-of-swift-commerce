import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, HelpCircle, Info, FileText, Shield, LogIn, LogOut, ChevronRight, MessageCircle, Save, Loader2, Phone, Mail, Plus, Trash2, Star, CreditCard, Bell, Settings, Wallet, ArrowLeft, BellRing, BellOff, Sun, Moon, Monitor, Globe, DollarSign, Paintbrush, Smartphone, Trash, RotateCcw, Lock, Eye, Database, UserCheck, AlertTriangle, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveChat } from '@/hooks/useLiveChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { BottomNav } from '@/components/store/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryAddress {
  id: string;
  label: string;
  address_line: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean | null;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  subtitle?: string;
  onClick?: () => void;
}

function MenuRow({ icon: Icon, label, subtitle, onClick }: MenuItem) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full px-4 py-4 hover:bg-muted/50 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 text-left">
        <span className="font-medium text-foreground">{label}</span>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

/* ─── App Settings Sheet ─── */
function AppSettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, lang, setLang } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (document.documentElement.classList.contains('dark')) return 'dark';
    return 'light';
  });
  const [currency, setCurrency] = useState('KES');

  const applyTheme = (t_val: 'light' | 'dark' | 'system') => {
    setTheme(t_val);
    if (t_val === 'dark') document.documentElement.classList.add('dark');
    else if (t_val === 'light') document.documentElement.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    localStorage.setItem('theme', t_val);
    toast.success(`${t('themeSet')} ${t_val}`);
  };

  const clearCache = () => {
    localStorage.removeItem('delivery_location');
    localStorage.removeItem('hallofresh_cart');
    toast.success(t('cacheClearedMsg'));
  };

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: t('light') },
    { value: 'dark' as const, icon: Moon, label: t('dark') },
    { value: 'system' as const, icon: Monitor, label: t('system') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/50">
          <SheetTitle className="text-lg font-bold">{t('appSettings')}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-5 space-y-6">
            {/* Appearance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Paintbrush className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('appearance')}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => applyTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <opt.icon className={`h-5 w-5 ${theme === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${theme === opt.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('language')}</h3>
              </div>
              <Select value={lang} onValueChange={(v) => { setLang(v as 'en' | 'so'); toast.success(t('languageUpdated')); }}>
                <SelectTrigger className="h-12 rounded-xl bg-muted border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="so">🇸🇴 Soomaali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('currency')}</h3>
              </div>
              <Select value={currency} onValueChange={(v) => { setCurrency(v); toast.success('Currency updated'); }}>
                <SelectTrigger className="h-12 rounded-xl bg-muted border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">🇰🇪 KES - Kenyan Shilling</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Device */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('storageData')}</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={clearCache}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Trash className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{t('clearCache')}</p>
                    <p className="text-xs text-muted-foreground">{t('clearCacheDesc')}</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('delivery_location');
                    toast.success(t('locationResetMsg'));
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{t('resetLocation')}</p>
                    <p className="text-xs text-muted-foreground">{t('resetLocationDesc')}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* App Info */}
            <div className="pt-2 border-t border-border/50">
              <div className="text-center space-y-1 py-4">
                <p className="text-sm font-semibold text-foreground">HalloFresh</p>
                <p className="text-xs text-muted-foreground">{t('version')} 1.0.0</p>
                <p className="text-xs text-muted-foreground">© 2025 HalloFresh Group. All rights reserved.</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Privacy Policy Sheet ─── */
function PrivacyPolicySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLanguage();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/50">
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('privacyPolicy')}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-5 space-y-6 text-sm leading-relaxed">
            <p className="text-xs text-muted-foreground">Last updated: February 2025</p>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">1. Information We Collect</h3>
              </div>
              <p className="text-muted-foreground">We collect information you provide directly, including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email address, phone number when you create an account.</li>
                <li><strong>Delivery Information:</strong> Delivery addresses, GPS location (with your permission).</li>
                <li><strong>Order History:</strong> Items purchased, payment method used, delivery preferences.</li>
                <li><strong>Device Information:</strong> Browser type, device type, IP address for security and analytics.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">2. How We Use Your Information</h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Process and deliver your orders accurately and on time.</li>
                <li>Send order confirmations, delivery updates, and receipts.</li>
                <li>Improve our services, product recommendations, and user experience.</li>
                <li>Communicate promotional offers (only with your consent).</li>
                <li>Prevent fraud and ensure the security of our platform.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">3. Data Security</h3>
              </div>
              <p className="text-muted-foreground">
                We implement industry-standard security measures including encryption (SSL/TLS), secure authentication, and regular security audits. Your payment information is processed by trusted third-party providers (M-Pesa) and is never stored on our servers.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">4. Your Rights</h3>
              </div>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Access, update, or delete your personal data at any time.</li>
                <li>Opt out of marketing communications via Notification Settings.</li>
                <li>Request a copy of all data we hold about you.</li>
                <li>Withdraw consent for location tracking.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">5. Cookies & Local Storage</h3>
              </div>
              <p className="text-muted-foreground">
                We use local storage to save your cart items, delivery location preferences, and theme settings. This data stays on your device and is not transmitted to our servers. You can clear this data at any time in App Settings.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">6. Third-Party Services</h3>
              </div>
              <p className="text-muted-foreground">
                We may share limited data with trusted partners for payment processing (M-Pesa/Safaricom), delivery logistics, and analytics. We never sell your personal information to third parties.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">7. Contact Us</h3>
              </div>
              <p className="text-muted-foreground">
                For privacy-related inquiries, contact us at:
              </p>
              <div className="mt-2 p-3 bg-muted rounded-xl space-y-1">
                <p className="text-foreground font-medium">HalloFresh Group</p>
                <p className="text-muted-foreground">📧 privacy@hallofresh.co.ke</p>
                <p className="text-muted-foreground">📞 +254 719 482 565</p>
                <p className="text-muted-foreground">📍 Nairobi, Kenya</p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Terms & Conditions Sheet ─── */
function TermsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useLanguage();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/50">
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            {t('termsConditions')}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-5 space-y-6 text-sm leading-relaxed">
            <p className="text-xs text-muted-foreground">Last updated: February 2025</p>

            <section>
              <h3 className="font-bold text-foreground mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using the HalloFresh application ("App"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">2. Services</h3>
              <p className="text-muted-foreground">
                HalloFresh is an on-demand grocery and food delivery platform operating in Nairobi, Kenya. We connect customers with local vendors and deliver products to their specified locations.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">3. Account Registration</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>You must provide accurate and complete information during registration.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You must be at least 18 years old to create an account.</li>
                <li>One account per person. Duplicate accounts may be suspended.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">4. Orders & Payments</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>All prices are displayed in Kenyan Shillings (KES) and include applicable taxes.</li>
                <li>Payment methods accepted: M-Pesa and Cash on Delivery.</li>
                <li>Orders are confirmed once payment is received or upon acceptance for Cash on Delivery.</li>
                <li>We reserve the right to cancel orders due to product unavailability, pricing errors, or suspected fraud.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">5. Delivery</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Delivery times are estimates and may vary due to traffic, weather, or demand.</li>
                <li>You must provide an accurate delivery address and be available to receive orders.</li>
                <li>If you are unavailable at the time of delivery, the rider may wait up to 10 minutes.</li>
                <li>Delivery fees may apply based on distance and order size.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">6. Returns & Refunds</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>If you receive damaged or incorrect items, report within 24 hours of delivery.</li>
                <li>Refunds are processed to the original payment method within 3-5 business days.</li>
                <li>Perishable items cannot be returned once accepted at delivery.</li>
                <li>Photographic evidence may be required for damage claims.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">7. User Conduct</h3>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                <li>Use the App for any unlawful purpose.</li>
                <li>Harass, threaten, or abuse delivery riders or support staff.</li>
                <li>Attempt to manipulate pricing, promotions, or referral programs.</li>
                <li>Share your account credentials with others.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">8. Intellectual Property</h3>
              <p className="text-muted-foreground">
                All content, trademarks, and intellectual property on the App belong to HalloFresh Group. You may not reproduce, distribute, or create derivative works without our written consent.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">9. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                HalloFresh shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability shall not exceed the amount paid for the specific order in question.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-foreground mb-2">10. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms. We will notify you of significant changes via email or in-app notification.
              </p>
            </section>

            <section>
              <div className="mt-2 p-3 bg-muted rounded-xl space-y-1">
                <p className="text-foreground font-medium">Questions?</p>
                <p className="text-muted-foreground">📧 legal@hallofresh.co.ke</p>
                <p className="text-muted-foreground">📞 +254 719 482 565</p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { startLiveChat, isConnecting: isConnectingChat } = useLiveChat();
  const { t } = useLanguage();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', username: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    push_orders: true, push_promos: true, email_orders: true, email_promos: false, sms_orders: true, sms_promos: false,
  });
  const [isLoadingNotifPrefs, setIsLoadingNotifPrefs] = useState(false);

  // Payment methods state
  interface PaymentMethod { id: string; type: string; mpesa_phone: string | null; label: string; is_default: boolean; }
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [newMpesaPhone, setNewMpesaPhone] = useState('');
  const [newMpesaLabel, setNewMpesaLabel] = useState('');

  const fetchPaymentMethods = async () => {
    if (!user) return;
    setIsLoadingPayments(true);
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    if (data) setPaymentMethods(data as PaymentMethod[]);
    setIsLoadingPayments(false);
  };

  const addPaymentMethod = async () => {
    if (!user || !newMpesaPhone.trim()) return;
    let phone = newMpesaPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (phone.startsWith('0')) phone = '+254' + phone.slice(1);
    else if (phone.startsWith('254')) phone = '+' + phone;
    else if (!phone.startsWith('+')) phone = '+254' + phone;

    if (!/^\+254[17]\d{8}$/.test(phone)) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }

    const isFirst = paymentMethods.length === 0;
    const { error } = await supabase.from('payment_methods').insert({
      user_id: user.id,
      type: 'mpesa',
      mpesa_phone: phone,
      label: newMpesaLabel.trim() || 'M-Pesa',
      is_default: isFirst,
    });
    if (error) {
      toast.error('Failed to add payment method');
      console.error(error);
    } else {
      toast.success('M-Pesa number saved');
      setNewMpesaPhone('');
      setNewMpesaLabel('');
      fetchPaymentMethods();
    }
  };

  const deletePaymentMethod = async (id: string) => {
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) toast.error('Failed to remove');
    else {
      toast.success('Payment method removed');
      fetchPaymentMethods();
    }
  };

  const setDefaultPayment = async (id: string) => {
    if (!user) return;
    // Remove current default
    await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id).eq('is_default', true);
    // Set new default
    await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
    toast.success('Default payment updated');
    fetchPaymentMethods();
  };

  const fetchNotifPrefs = async () => {
    if (!user) return;
    setIsLoadingNotifPrefs(true);
    const { data } = await supabase
      .from('notification_preferences')
      .select('push_orders, push_promos, email_orders, email_promos, sms_orders, sms_promos')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setNotifPrefs(data);
    }
    setIsLoadingNotifPrefs(false);
  };

  const saveNotifPrefs = async (updated: typeof notifPrefs) => {
    if (!user) return;
    setNotifPrefs(updated);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      toast.error('Failed to save preference');
      console.error('notif prefs save error:', error);
    } else {
      toast.success('Preference saved');
    }
  };

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', address_line: '', city: '' });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        username: profile.username || '',
      });
    }
  }, [profile]);

  const fetchAddresses = async () => {
    if (!user) return;
    setIsLoadingAddresses(true);
    const { data } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
    setIsLoadingAddresses(false);
  };

  const handleOpenAddresses = () => {
    setIsAddressOpen(true);
    fetchAddresses();
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const { error } = await updateProfile({
      full_name: profileForm.full_name || null,
      phone: profileForm.phone || null,
      username: profileForm.username || null,
    });
    setIsSavingProfile(false);
    if (error) {
      toast.error(t('profileFailed'));
    } else {
      toast.success(t('profileUpdated'));
      setIsProfileOpen(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user || !newAddress.address_line.trim()) {
      toast.error('Please enter an address');
      return;
    }
    setIsAddingAddress(true);
    const { error } = await supabase.from('delivery_addresses').insert({
      user_id: user.id,
      label: newAddress.label,
      address_line: newAddress.address_line,
      city: newAddress.city || null,
      is_default: addresses.length === 0,
    });
    if (error) toast.error(t('addressFailed'));
    else {
      toast.success(t('addressAdded'));
      setNewAddress({ label: 'Home', address_line: '', city: '' });
      fetchAddresses();
    }
    setIsAddingAddress(false);
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from('delivery_addresses').delete().eq('id', id);
    if (error) toast.error(t('addressFailed'));
    else { toast.success(t('addressRemoved')); fetchAddresses(); }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('delivery_addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('delivery_addresses').update({ is_default: true }).eq('id', id);
    toast.success(t('defaultUpdated'));
    fetchAddresses();
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('signedOut'));
    navigate('/');
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchNotifPrefs();
      fetchPaymentMethods();
    }
  }, [user]);

  const generalItems: MenuItem[] = [
    { icon: User, label: t('profile'), subtitle: profile?.full_name || t('editYourProfile'), onClick: () => setIsProfileOpen(true) },
    { icon: MapPin, label: t('myAddresses'), subtitle: t('manageDelivery'), onClick: handleOpenAddresses },
    { icon: CreditCard, label: t('paymentMethods'), subtitle: paymentMethods.length > 0 ? `${paymentMethods.length} saved` : t('addCards'), onClick: () => setIsPaymentOpen(true) },
    { icon: Bell, label: t('notifications'), subtitle: t('notifSubtitle'), onClick: () => setIsNotificationsOpen(true) },
  ];

  const supportItems: MenuItem[] = [
    { icon: MessageCircle, label: t('liveChat'), subtitle: isConnectingChat ? t('connectingToSupport') : t('chatWithSupport'), onClick: startLiveChat },
    { icon: HelpCircle, label: t('helpAndSupport'), subtitle: t('faqContact'), onClick: () => window.open('tel:+254719482565', '_self') },
    { icon: Info, label: t('aboutUs'), subtitle: t('learnAbout'), onClick: () => navigate('/about') },
    { icon: FileText, label: t('termsConditions'), subtitle: t('usagePolicies'), onClick: () => setIsTermsOpen(true) },
    { icon: Shield, label: t('privacyPolicy'), subtitle: t('howWeProtect'), onClick: () => setIsPrivacyOpen(true) },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background border-b border-border"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('accountTitle')}</h1>
        </div>
      </motion.header>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 p-5 bg-card rounded-2xl shadow-sm"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {profile?.full_name || user?.email || t('guestUser')}
            </h2>
            {user ? (
              <>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {memberSince && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t('memberSince')} {memberSince}</p>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 rounded-full text-xs"
                onClick={() => navigate('/auth')}
              >
                {t('loginToView')}
              </Button>
            )}
          </div>
        </div>
        {user && (
          <Button
            variant="outline"
            className="w-full mt-4 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setIsProfileOpen(true)}
          >
            {t('editProfile')}
          </Button>
        )}
      </motion.div>

      {/* Wallet & Loyalty Row */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3 mx-4 mt-4"
        >
          <div className="bg-card rounded-2xl p-4 shadow-sm text-center">
            <Wallet className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{t('wallet')}</p>
            <p className="text-lg font-bold text-foreground">Ksh 0</p>
            <Button size="sm" variant="outline" className="mt-2 rounded-full text-xs h-7 px-3 border-primary/30 text-primary">
              {t('topUp')}
            </Button>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm text-center">
            <Star className="h-6 w-6 text-warning mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{t('loyaltyPoints')}</p>
            <p className="text-lg font-bold text-foreground">0</p>
            <Button size="sm" variant="outline" className="mt-2 rounded-full text-xs h-7 px-3 border-primary/30 text-primary">
              {t('redeem')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Email Verification Banner */}
      {user && !user.email_confirmed_at && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-4 p-4 bg-warning/10 border border-warning/20 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{t('verifyEmail')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 rounded-full text-xs h-7 border-primary/30 text-primary"
                onClick={() => toast.info('Verification email sent!')}
              >
                {t('sendVerification')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* General Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-4 mt-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t('general')}</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm divide-y divide-border/50">
          {generalItems.map(item => <MenuRow key={item.label} {...item} />)}
        </div>
      </motion.div>

      {/* Help & Support */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="px-4 mt-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t('helpSupport')}</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm divide-y divide-border/50">
          {supportItems.map(item => <MenuRow key={item.label} {...item} />)}
        </div>
      </motion.div>

      {/* App Settings & Logout */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-4 mt-6">
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm divide-y divide-border/50">
          <MenuRow icon={Settings} label={t('appSettings')} subtitle={t('themeLangCache')} onClick={() => setIsSettingsOpen(true)} />
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 w-full px-4 py-4 hover:bg-destructive/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <span className="font-medium text-destructive">{t('logOut')}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-4 w-full px-4 py-4 hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <LogIn className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-primary">{t('signIn')}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground mt-6 mb-4">HalloFresh v1.0.0</p>

      <BottomNav />

      {/* Profile Edit Sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-5 py-4 border-b border-border/50">
            <SheetTitle className="text-lg font-bold">{t('editProfile')}</SheetTitle>
          </SheetHeader>
          <div className="p-5 space-y-5">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">{t('fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" placeholder={t('yourFullName')} className="pl-10 h-12 rounded-xl bg-muted border-0" value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">{t('phoneNumber')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="0712345678" className="pl-10 h-12 rounded-xl bg-muted border-0" value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">{t('username')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" placeholder={t('username')} className="pl-10 h-12 rounded-xl bg-muted border-0" value={profileForm.username} onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input disabled className="pl-10 h-12 rounded-xl bg-muted border-0 text-muted-foreground" value={user?.email || ''} />
              </div>
            </div>
            <Button className="w-full h-12 rounded-xl font-semibold" onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('saving')}</> : <><Save className="h-4 w-4 mr-2" /> {t('saveChanges')}</>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Addresses Sheet */}
      <Sheet open={isAddressOpen} onOpenChange={setIsAddressOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border/50">
            <SheetTitle className="text-lg font-bold">{t('myAddresses')}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingAddresses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">{t('noSavedAddresses')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('addFirstAddress')}</p>
              </div>
            ) : (
              <AnimatePresence>
                {addresses.map((addr) => (
                  <motion.div
                    key={addr.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl border ${addr.is_default ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${addr.is_default ? 'bg-primary' : 'bg-muted'}`}>
                        <MapPin className={`h-4 w-4 ${addr.is_default ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{addr.label}</span>
                          {addr.is_default && <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t('default')}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{addr.address_line}</p>
                        {addr.city && <p className="text-xs text-muted-foreground">{addr.city}</p>}
                      </div>
                      <div className="flex gap-1">
                        {!addr.is_default && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleSetDefault(addr.id)}>
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteAddress(addr.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          <div className="border-t border-border/50 p-4 space-y-3 bg-muted/30">
            <h3 className="text-sm font-semibold">{t('addNewAddress')}</h3>
            <Input placeholder="Label (e.g. Home, Office)" className="h-11 rounded-xl bg-background border-border/50" value={newAddress.label} onChange={(e) => setNewAddress(p => ({ ...p, label: e.target.value }))} />
            <Input placeholder="Address line" className="h-11 rounded-xl bg-background border-border/50" value={newAddress.address_line} onChange={(e) => setNewAddress(p => ({ ...p, address_line: e.target.value }))} />
            <Input placeholder="City (optional)" className="h-11 rounded-xl bg-background border-border/50" value={newAddress.city} onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))} />
            <Button className="w-full h-11 rounded-xl font-medium" onClick={handleAddAddress} disabled={isAddingAddress}>
              {isAddingAddress ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('addAddress')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-5 py-4 border-b border-border/50">
            <SheetTitle className="text-lg font-bold">{t('notifSettings')}</SheetTitle>
          </SheetHeader>
          <div className="p-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BellRing className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('pushNotifications')}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{t('orderUpdates')}</p><p className="text-xs text-muted-foreground">{t('statusChanges')}</p></div>
                  <Switch checked={notifPrefs.push_orders} onCheckedChange={(v) => saveNotifPrefs({ ...notifPrefs, push_orders: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{t('promoDeals')}</p><p className="text-xs text-muted-foreground">{t('specialOffers')}</p></div>
                  <Switch checked={notifPrefs.push_promos} onCheckedChange={(v) => saveNotifPrefs({ ...notifPrefs, push_promos: v })} />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('emailNotifications')}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{t('orderReceipts')}</p><p className="text-xs text-muted-foreground">{t('confirmDelivery')}</p></div>
                  <Switch checked={notifPrefs.email_orders} onCheckedChange={(v) => saveNotifPrefs({ ...notifPrefs, email_orders: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{t('marketingEmails')}</p><p className="text-xs text-muted-foreground">{t('weeklyDeals')}</p></div>
                  <Switch checked={notifPrefs.email_promos} onCheckedChange={(v) => saveNotifPrefs({ ...notifPrefs, email_promos: v })} />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{t('smsNotifications')}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{t('deliverySms')}</p><p className="text-xs text-muted-foreground">{t('riderArrival')}</p></div>
                  <Switch checked={notifPrefs.sms_orders} onCheckedChange={(v) => saveNotifPrefs({ ...notifPrefs, sms_orders: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{t('promotionalSms')}</p><p className="text-xs text-muted-foreground">{t('flashSales')}</p></div>
                  <Switch checked={notifPrefs.sms_promos} onCheckedChange={(v) => saveNotifPrefs({ ...notifPrefs, sms_promos: v })} />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => {
                  const allOff = { push_orders: false, push_promos: false, email_orders: false, email_promos: false, sms_orders: false, sms_promos: false };
                  saveNotifPrefs(allOff);
                  toast.success(t('disableAll'));
                }}
              >
                <BellOff className="h-4 w-4 mr-2" />
                {t('disableAll')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Methods Sheet */}
      <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-5 py-4 border-b border-border/50">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Methods
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-5 space-y-6">
              {/* Saved M-Pesa Numbers */}
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3">Saved M-Pesa Numbers</h3>
                {isLoadingPayments ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-6 bg-muted/50 rounded-xl">
                    <Phone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No saved payment methods</p>
                    <p className="text-xs text-muted-foreground mt-1">Add an M-Pesa number for faster checkout</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{pm.label}</p>
                          <p className="text-xs text-muted-foreground">{pm.mpesa_phone}</p>
                        </div>
                        {pm.is_default ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Default</span>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setDefaultPayment(pm.id)}>
                            Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deletePaymentMethod(pm.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New */}
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3">Add M-Pesa Number</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <Input
                      placeholder="07XXXXXXXX"
                      value={newMpesaPhone}
                      onChange={(e) => setNewMpesaPhone(e.target.value)}
                      className="h-12 rounded-xl bg-muted border-0 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Label (optional)</Label>
                    <Input
                      placeholder="e.g. Personal, Business"
                      value={newMpesaLabel}
                      onChange={(e) => setNewMpesaLabel(e.target.value)}
                      className="h-12 rounded-xl bg-muted border-0 mt-1"
                    />
                  </div>
                  <Button className="w-full h-12 rounded-xl" onClick={addPaymentMethod} disabled={!newMpesaPhone.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Save M-Pesa Number
                  </Button>
                </div>
              </div>

              {/* Cash on Delivery note */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Cash on Delivery</p>
                </div>
                <p className="text-xs text-muted-foreground">Always available at checkout. Pay the rider when your order arrives.</p>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* App Settings Sheet */}
      <AppSettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Privacy Policy Sheet */}
      <PrivacyPolicySheet open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen} />

      {/* Terms & Conditions Sheet */}
      <TermsSheet open={isTermsOpen} onOpenChange={setIsTermsOpen} />
    </div>
  );
}
