import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  sendEmailOtp: (email: string) => Promise<{ error: string | null }>;
  verifyEmailOtp: (email: string, code: string, fullName?: string) => Promise<{ error: string | null }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneOtp: (phone: string, code: string, fullName?: string) => Promise<{ error: string | null; isNewUser?: boolean }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            setProfile(data);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => setProfile(data));
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendEmailOtp = async (email: string) => {
    try {
      const res = await supabase.functions.invoke('send-email-otp', {
        body: { email },
      });
      if (res.error) return { error: res.error.message };
      const data = res.data as any;
      if (data?.error) return { error: data.error };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to send verification code' };
    }
  };

  const verifyEmailOtp = async (email: string, code: string, fullName?: string) => {
    try {
      const res = await supabase.functions.invoke('verify-email-otp', {
        body: { email, code, fullName },
      });
      if (res.error) return { error: res.error.message };
      const data = res.data as any;
      if (data?.error) return { error: data.error };

      // Use the verification URL to sign the user in
      if (data?.verification_url) {
        const url = new URL(data.verification_url);
        const token_hash = url.searchParams.get('token') || data.token_hash;
        
        if (token_hash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'magiclink',
          });
          if (verifyError) return { error: verifyError.message };
        }
      }

      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to verify code' };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to sign in' };
    }
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to sign up' };
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    try {
      const res = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });
      if (res.error) return { error: res.error.message };
      const data = res.data as any;
      if (data?.error) return { error: data.error };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Failed to send OTP' };
    }
  };

  const verifyPhoneOtp = async (phone: string, code: string, fullName?: string): Promise<{ error: string | null; isNewUser?: boolean }> => {
    try {
      const res = await supabase.functions.invoke('verify-otp', {
        body: { phone, code, fullName },
      });
      if (res.error) return { error: res.error.message };
      const data = res.data as any;
      if (data?.error) return { error: data.error };

      const isNewUser = data?.isNewUser ?? false;

      // Use the verification URL to sign the user in
      if (data?.verification_url) {
        const url = new URL(data.verification_url);
        const token_hash = url.searchParams.get('token') || data.token_hash;
        if (token_hash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'magiclink',
          });
          if (verifyError) return { error: verifyError.message };
        }
      }

      return { error: null, isNewUser };
    } catch (e: any) {
      return { error: e.message || 'Failed to verify OTP' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      sendEmailOtp,
      verifyEmailOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
