import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabaseService, SignInCredentials, SignUpCredentials } from '../services/implementations/SupabaseService';
import { ContractResult } from '../types/contracts';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (credentials: SignInCredentials) => Promise<ContractResult<User>>;
  signUp: (credentials: SignUpCredentials) => Promise<ContractResult<User>>;
  signOut: () => Promise<ContractResult<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isEffectMounted = true; // Renamed to avoid confusion

    const initializeAuth = async () => {
      await supabaseService.waitForInitialization();
      if (!isEffectMounted) return;

      const initialUser = supabaseService.getCurrentUser();
      const initialSession = supabaseService.getUserSession();

      if (isEffectMounted) {
        setUser(initialUser);
        setSession(initialSession);
        setIsLoading(false);
      }

      const unsubscribe = supabaseService.subscribeToAuthStateChange(
        (event: AuthChangeEvent, currentSession: Session | null) => {
          if (!isEffectMounted) return;

          setUser(currentSession?.user ?? null);
          setSession(currentSession);
          setError(null);

          switch (event) {
            case 'SIGNED_IN':
            case 'USER_UPDATED':
            case 'TOKEN_REFRESHED':
              break;
            case 'SIGNED_OUT':
              break;
            case 'PASSWORD_RECOVERY':
              break;
            case 'INITIALIZED':
              if (isEffectMounted && !user && currentSession?.user) {
                setUser(currentSession.user);
                setSession(currentSession);
              }
              if (isEffectMounted) setIsLoading(false);
              break;
            default:
              break;
          }
        }
      );

      return () => {
        isEffectMounted = false;
        unsubscribe();
      };
    };

    initializeAuth();

    return () => {
      isEffectMounted = false;
    };
  }, [user]);

  const handleAuthOperation = async <TData>(
    operation: () => Promise<ContractResult<TData>>
  ): Promise<ContractResult<TData>> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      if (!result.success && result.error) {
        setError(result.error); // If operation causes error, set it
      }
      setIsLoading(false);
      return result;
    } catch (e: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === 'string') {
        errorMessage = e;
      }
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage, data: null };
    }
  };

  const signIn = async (credentials: SignInCredentials): Promise<ContractResult<User>> => {
    return handleAuthOperation(() => supabaseService.signIn(credentials));
  };

  const signUp = async (credentials: SignUpCredentials): Promise<ContractResult<User>> => {
    return handleAuthOperation(() => supabaseService.signUp(credentials));
  };

  const signOut = async (): Promise<ContractResult<boolean>> => {
    return handleAuthOperation(() => supabaseService.signOut());
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
