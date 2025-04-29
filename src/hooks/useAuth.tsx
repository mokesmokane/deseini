import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Define what the context will provide
interface AuthContextType {
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component 
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        console.log("Auth initialized:", data.session ? "Logged in" : "Not logged in");
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed:", session ? "Logged in" : "Logged out");
        setSession(session);
      }
    );

    // Clean up
    return () => subscription.unsubscribe();
  }, []);

  // Create the value to provide
  const logout = async () => {
    try {
      // Clear all application state in localStorage
      // Instead of trying to list all keys, clear everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      
      // Force reload the page to ensure all React state is completely reset
      // This is the most reliable way to ensure nothing persists
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Create the value to provide
  const value = { session, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for components to use
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};
