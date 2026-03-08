import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const ensureAdminRoleInDB = async (userId: string) => {
    try {
      // Check if admin role already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      if (existing) return;

      // Try inserting super_admin role
      const { error: insertErr } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'super_admin' as any });

      if (!insertErr) {
        if (import.meta.env.DEV) console.log('[AuthContext] Admin role created in DB');
        return;
      }

      // Insert failed — try updating existing customer role to super_admin
      const { error: updateErr } = await supabase
        .from('user_roles')
        .update({ role: 'super_admin' as any })
        .eq('user_id', userId);

      if (!updateErr) {
        if (import.meta.env.DEV) console.log('[AuthContext] Admin role updated in DB');
      } else if (import.meta.env.DEV) {
        console.warn('[AuthContext] Could not set admin role in DB:', updateErr.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[AuthContext] ensureAdminRoleInDB error:', err);
    }
  };

  const checkAdminRole = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[AuthContext] Error checking admin role:', error);
        }
        if (import.meta.env.VITE_ADMIN_EMAIL && userEmail === import.meta.env.VITE_ADMIN_EMAIL) {
          ensureAdminRoleInDB(userId);
          return true;
        }
        return false;
      }

      if (data) {
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Admin role confirmed:', data.role);
        }
        return true;
      }

      if (import.meta.env.VITE_ADMIN_EMAIL && userEmail === import.meta.env.VITE_ADMIN_EMAIL) {
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Admin email matched, ensuring role in DB...');
        }
        await ensureAdminRoleInDB(userId);
        return true;
      }

      return false;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AuthContext] Error checking admin:', err);
      }
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let currentUserId: string | null = null;
    let cachedAdminStatus = false;

    // Safety timeout — never stay in loading state more than 3 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    // Get initial session — check admin in background, don't block loading
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error && import.meta.env.DEV) {
        console.error('[AuthContext] Error getting session:', error);
      }

      currentUserId = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id, session.user.email).then((adminStatus) => {
          if (mounted) {
            cachedAdminStatus = adminStatus;
            setIsAdmin(adminStatus);
          }
        });
      }
      setLoading(false);
    }).catch((err) => {
      if (import.meta.env.DEV) console.error('[AuthContext] getSession fatal:', err);
      if (mounted) setLoading(false);
    });

    // Debounce timer for SIGNED_OUT — prevents false sign-outs during cross-tab token refresh
    let signOutTimer: ReturnType<typeof setTimeout> | null = null;
    let lastSignedInAt = 0;

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (import.meta.env.DEV) {
          console.log('[AuthContext] Auth state change:', event);
        }

        // Any event with a session cancels a pending sign-out (it was a false SIGNED_OUT)
        if (session?.user && signOutTimer) {
          clearTimeout(signOutTimer);
          signOutTimer = null;
        }

        // Token refresh — update session silently (tokens changed, user didn't)
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          return;
        }

        // Debounce SIGNED_OUT — wait 3s to confirm it's real (not cross-tab / Razorpay noise)
        if (event === 'SIGNED_OUT') {
          const signOutReceivedAt = Date.now();
          if (signOutTimer) clearTimeout(signOutTimer);
          signOutTimer = setTimeout(() => {
            if (!mounted) return;
            signOutTimer = null;
            // If a SIGNED_IN happened after this SIGNED_OUT, it's stale — skip
            if (lastSignedInAt > signOutReceivedAt) return;
            currentUserId = null;
            cachedAdminStatus = false;
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }, 3000);
          return;
        }

        // SIGNED_IN / INITIAL_SESSION / USER_UPDATED — only fully process if user changed
        if (session?.user) {
          lastSignedInAt = Date.now();

          if (session.user.id === currentUserId) {
            // Same user — just refresh the session object (tokens may have changed)
            setSession(session);
            return;
          }

          // Different user or first sign-in — full state update
          currentUserId = session.user.id;
          setSession(session);
          setUser(session.user);
          const adminStatus = await checkAdminRole(session.user.id, session.user.email);
          if (mounted) {
            cachedAdminStatus = adminStatus;
            setIsAdmin(adminStatus);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (signOutTimer) clearTimeout(signOutTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[AuthContext] Sign in error:', error);
        }
        // Normalize error messages for better UX
        let friendlyMessage = error.message;
        if (error.message?.includes('Invalid login credentials')) {
          friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message?.includes('Email not confirmed')) {
          friendlyMessage = 'Please verify your email address before signing in.';
        } else if (error.message?.includes('rate limit')) {
          friendlyMessage = 'Too many attempts. Please wait a moment and try again.';
        }
        return { error: { ...error, message: friendlyMessage } };
      }

      // After successful sign in, check admin status
      if (data.user) {
        const adminStatus = await checkAdminRole(data.user.id, data.user.email);
        setIsAdmin(adminStatus);
      }

      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[AuthContext] Unexpected sign in error:', err);
      }
      return { 
        error: { 
          message: 'An unexpected error occurred. Please try again or contact support.',
          ...err 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName }
        }
      });

      // Handle "Database error saving new user" - trigger failed but user may have been created
      if (error?.message?.includes('Database error')) {
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Trigger failed, attempting to create profile manually...');
        }
        
        // Try to sign in - the user might have been created despite the trigger failure
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (signInData?.user) {
          // User was created! Now create profile manually
          await createProfileManually(signInData.user.id, email, fullName);
          return { error: null };
        }
        
        // If sign in failed too, return the original error
        if (import.meta.env.DEV) {
          console.error('[AuthContext] Sign up error:', error);
        }
        return { 
          error: { 
            ...error, 
            message: 'Registration failed due to a server issue. Please try again or contact support.' 
          } 
        };
      }

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[AuthContext] Sign up error:', error);
        }
        
        // Normalize error messages
        let friendlyMessage = error.message;
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          friendlyMessage = 'This email is already registered. Please try logging in instead.';
        } else if (error.message?.includes('rate limit')) {
          friendlyMessage = 'Too many attempts. Please wait a moment and try again.';
        } else if (error.message?.includes('password')) {
          friendlyMessage = 'Password does not meet requirements. Please use a stronger password.';
        }
        
        return { error: { ...error, message: friendlyMessage } };
      }

      // After successful signup, create profile manually to ensure it exists
      if (data.user) {
        await createProfileManually(data.user.id, email, fullName);
      }

      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[AuthContext] Unexpected sign up error:', err);
      }
      return { 
        error: { 
          message: 'An unexpected error occurred during registration. Please try again or contact support.',
          ...err 
        } 
      };
    }
  };

  // Helper function to create profile manually when trigger fails
  const createProfileManually = async (userId: string, email: string, fullName: string) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email,
            full_name: fullName
          });

        if (profileError && import.meta.env.DEV) {
          console.warn('[AuthContext] Could not create profile:', profileError);
        } else if (import.meta.env.DEV) {
          console.log('[AuthContext] Profile created manually');
        }
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingRole) {
        // Create customer role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'customer'
          });

        if (roleError && import.meta.env.DEV) {
          console.warn('[AuthContext] Could not create role:', roleError);
        } else if (import.meta.env.DEV) {
          console.log('[AuthContext] Role created manually');
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AuthContext] Error in createProfileManually:', err);
      }
    }
  };

  const signOut = async () => {
    try {
      // Clear state first for immediate UI update
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AuthContext] Sign out error:', err);
      }
      // Still clear state even if Supabase call fails
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
