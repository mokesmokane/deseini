import LogoCarousel from '../LogoCarousel';
import TextInput from './IdeationChat/TextInput';
import { MessagingProvider, useMessaging } from './MessagingProvider';
import ChatCanvasContainer from './IdeationChat/ChatCanvasContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import AuthForm from '../auth/AuthForm';

const AnimatedContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const { messages, isCanvasVisible } = useMessaging();
  const hasStarted = messages.length > 0;
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  
    return () => subscription.unsubscribe();
  }, []);
  
  // Show auth UI if user explicitly requests it
  const handleShowAuth = (view: 'sign_in' | 'sign_up') => {
    setAuthView(view);
    setShowAuth(true);
  };
  
  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  return (
    <div className="w-full h-screen bg-white text-black flex flex-col items-center justify-between relative">
      <main className="flex flex-col items-center w-full flex-grow overflow-hidden hide-scrollbar"
        style={{ 
          maxWidth: '100%',
          transition: 'max-width 0.3s ease-in-out'
        }}
      >
        {/* Show carousel or chat panel, no animation */}
        {!hasStarted ? (
          <div className="w-full max-w-[36rem] mx-auto">
            <div className="h-20"></div>
            <LogoCarousel height="240px" />
            {/* Reserve space where the input initially appears */}
          </div>
        ) : (
          <div className="w-full flex-1 overflow-hidden hide-scrollbar">
            <ChatCanvasContainer isCanvasVisible={isCanvasVisible} />
          </div>
        )}
      </main>
      
      {/* Auth area only */}
      <AnimatePresence mode="wait">
        {(!session && showAuth) ? (
          <motion.div
            key="auth-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[36rem] px-2 pb-4 pt-2"
            style={{ 
              position: hasStarted ? 'sticky' : 'absolute', 
              bottom: hasStarted ? 0 : 'auto',
              top: !hasStarted ? 'calc(10px + 240px + 20px)' : 'auto'
            }}
          >
            <AuthForm 
              initialView={authView} 
              onAuthSuccess={handleAuthSuccess} 
            />
          </motion.div>
        ) : !hasStarted ? (
          <motion.div
            key="under-carousel"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-[36rem] px-2 pb-4 pt-2 absolute"
            style={{ top: 'calc(10px + 240px + 20px)' }} // Position after carousel (carousel height + padding)
          >
            <TextInput hasStarted={hasStarted} />
            
            {/* Auth links - shown below input when user hasn't started typing */}
            {!session && (
              <div className="flex justify-center mt-6 text-sm space-x-24">
              <a 
                onClick={() => handleShowAuth('sign_in')} 
                className="text-gray-700 hover:underline focus:outline-none cursor-pointer border-0"
              >
                Sign In
              </a>
              <a 
                onClick={() => handleShowAuth('sign_up')} 
                className="text-gray-700 hover:underline focus:outline-none cursor-pointer border-0"
              >
                Sign Up
              </a>
            </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  return (
    <MessagingProvider>
      <AnimatedContent />
    </MessagingProvider>
  );
};

export default LandingPage;
