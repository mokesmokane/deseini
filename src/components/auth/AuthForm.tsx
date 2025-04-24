import { useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';

interface AuthFormProps {
  initialView?: 'sign_in' | 'sign_up';
  onAuthSuccess?: () => void;
}

// Add custom styles to override browser autofill styles
const inputStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const AuthForm = ({ initialView = 'sign_in', onAuthSuccess }: AuthFormProps) => {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      if (onAuthSuccess) onAuthSuccess();
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      setAuthView('sign_in');
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      
      if (error) throw error;
      alert('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{inputStyles}</style>
      <div className="bg-white shadow-lg rounded-lg border border-gray-100 p-8 transition-all">
        {/* <h2 className="text-2xl font-light mb-8 text-center">
          {authView === 'sign_in' ? 'Sign In' : 'Create Account'}
        </h2> */}
        
        {errorMessage && (
          <div className="bg-red-50 text-red-800 p-3 mb-5 text-sm rounded">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={authView === 'sign_in' ? handleSignIn : handleSignUp}>
          <div className="mb-5">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-md py-3 px-4 focus:border-black focus:ring-0 bg-white transition-colors duration-200 outline-none appearance-none"
                placeholder="Your email address"
                required
              />
            </div>
          </div>
          
          <div className="mb-7">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-md py-3 px-4 focus:border-black focus:ring-0 bg-white transition-colors duration-200 outline-none appearance-none"
                placeholder="Your password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 hover:bg-gray-900 transition-colors disabled:opacity-70 mt-3"
          >
            {loading ? 'Processing...' : authView === 'sign_in' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center flex justify-center space-x-6">
          {authView === 'sign_in' && (
            <a
              onClick={handleForgotPassword}
              className="text-sm text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              Forgot your password?
            </a>
          )}
          
          <a
            onClick={() => setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in')}
            className="text-sm text-gray-500 hover:text-black transition-colors cursor-pointer"
          >
            {authView === 'sign_in' ? "No account? Sign up" : "Have an account? Sign in"}
          </a>
        </div>
      </div>
    </>
  );
};

export default AuthForm;
