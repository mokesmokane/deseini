import LogoCarousel from '../LogoCarousel';
import TextInput from './IdeationChat/TextInput';
import { useMessaging } from '../../contexts/Messaging/MessagingProvider';
import ChatCanvasContainer from './IdeationChat/ChatCanvasContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import AuthForm from '../auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { useParams } from 'react-router-dom';
import { ActiveTabProvider } from '../../contexts/ActiveTabProvider';

const AnimatedContent = () => {
  const { projectId } = useParams<{ projectId?: string; chatId?: string }>();
  const { session } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const { messages, isCanvasVisible } = useMessaging();
  const {project, fetchProject, fetchProjectCharts} = useProject();
  const hasStarted = messages.length > 0 || (projectId !== null && projectId !== undefined);
  
  // Only handle project loading via useEffect
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      if (project?.id !== projectId) {
        fetchProject(projectId!);
      }
    }
  }, [projectId, fetchProject, project?.id]);

  // Fetch charts when project is loaded or projectId changes
  useEffect(() => {
    if (projectId && projectId !== project?.id && projectId !== 'new') {
      fetchProjectCharts(projectId);
    }
  }, [projectId, fetchProjectCharts]); // Added fetchProjectCharts dependency

  // Show auth UI only when user explicitly requests it
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
          <>
            <div className="w-full flex-1 overflow-hidden hide-scrollbar">
              <ChatCanvasContainer isCanvasVisible={isCanvasVisible || projectId !== null && projectId !== undefined} />
            </div>
          </>
        )}
      </main>
      
      {/* Auth area or text input */}
      <AnimatePresence mode="wait">
        {showAuth ? (
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
    <ActiveTabProvider>
      <AnimatedContent />
    </ActiveTabProvider>
  );
};

export default LandingPage;
