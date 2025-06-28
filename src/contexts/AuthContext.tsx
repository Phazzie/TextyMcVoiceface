import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabaseService, SignInCredentials, SignUpCredentials } from '../services/implementations/SupabaseService'; // Adjust path as needed
import { ContractResult } from '../types/contracts';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (credentials: SignInCredentials) => Promise<ContractResult<User>>;
  signUp: (credentials: SignUpCredentials) => Promise<ContractResult<User>>;
  signOut: () => Promise<ContractResult<boolean>>;
  // add other auth-related states or functions if needed, e.g., sendPasswordResetEmail
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for SupabaseService to be initialized before checking session or subscribing
    supabaseService.waitForInitialization().then(() => {
      // Initial check for user and session
      const initialUser = supabaseService.getCurrentUser();
      const initialSession = supabaseService.getUserSession();

      setUser(initialUser);
      setSession(initialSession);
      setIsLoading(false); // Initial load done

      // Subscribe to auth state changes
      const unsubscribe = supabaseService.subscribeToAuthStateChange(
        (event: AuthChangeEvent, currentSession: Session | null) => {
          // console.log('AuthContext: AuthChangeEvent', event, currentSession);
          setUser(currentSession?.user ?? null);
          setSession(currentSession);
          setError(null); // Clear previous errors on auth change

          // Handle specific events if needed
          switch (event) {
            case 'SIGNED_IN':
              // Handled by setting user/session
              break;
            case 'SIGNED_OUT':
              // Handled by setting user/session to null
              break;
            case 'USER_UPDATED':
              // User profile might have changed
              setUser(currentSession?.user ?? null);
              break;
            case 'PASSWORD_RECOVERY':
              // Might want to set a specific state for this
              break;
            case 'TOKEN_REFRESHED':
              // Session was refreshed
              break;
            case 'INITIALIZED':
              // This event is now also handled by the initial check above.
              // Could be useful if initial check happens before subscription is fully set.
              if (!user && currentSession?.user){ // if user is not set from initial check
                setUser(currentSession.user);
                setSession(currentSession);
              }
              setIsLoading(false); // Ensure loading is false after init
              break;
            default:
              break;
          }
        }
      );

      return () => {
        unsubscribe();
      };
    });
  }, []); // Empty dependency array ensures this runs once on mount

  const handleAuthOperation = async <T>(
    operation: () => Promise<ContractResult<T>>,
    successCallback?: (data: T) => void
  ): Promise<ContractResult<T>> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      if (result.success && result.data) {
        // User and session state will be updated by the onAuthStateChange listener
        if (successCallback) successCallback(result.data);
      } else if (result.error) {
        setError(result.error);
      }
      setIsLoading(false);
      return result;
    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (credentials: SignInCredentials): Promise<ContractResult<User>> => {
    return handleAuthOperation(() => supabaseService.signIn(credentials));
  };

  const signUp = async (credentials: SignUpCredentials): Promise<ContractResult<User>> => {
    // After sign-up, Supabase typically sends a confirmation email.
    // The user state might not immediately change to signed-in until confirmation.
    // The onAuthStateChange listener will handle the actual user state updates.
    return handleAuthOperation(() => supabaseService.signUp(credentials));
  };

  const signOut = async (): Promise<ContractResult<boolean>> => {
    return handleAuthOperation(() => supabaseService.signOut());
  };

  // Add other methods like sendPasswordResetEmail, updateUser, etc. as needed

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
