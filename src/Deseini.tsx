import LogoCarousel from './components/LogoCarousel';
import toast, { Toaster } from 'react-hot-toast';
import { Outlet, useNavigate } from 'react-router-dom';
import AccountDropdown  from './components/AccountDropdown';
import { ProjectsDropdown } from './components/ProjectsDropdown';
import { useProject } from './contexts/ProjectContext';
import { useMessaging } from './contexts/Messaging/MessagingProvider';
import { useDraftMarkdown } from './contexts/DraftMarkdownProvider';
import { useAuth } from './hooks/useAuth';


export default function Deseini() {
  const {projectsList, setNoProject} = useProject();
  const navigate = useNavigate();
  const {session, logout} = useAuth();
  const {setMessages, reset} = useMessaging();
  const {resetMarkdown} = useDraftMarkdown();

  const navigateToLanding = () => {
    // First navigate to prevent UI flickering
    navigate('/');
    
    // Then update all states to maintain a consistent UI
    setTimeout(() => {
      setNoProject();
      reset();
      resetMarkdown();
    }, 10);
  };

  return (
    <>
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm w-full border-b border-gray-200 h-16 flex-shrink-0 overflow-visible">
        <div className="py-4 px-2 sm:px-4 lg:px-6 flex items-center justify-between w-full overflow-visible">
          <div 
            className="cursor-pointer flex items-center flex-shrink-0" 
            onClick={navigateToLanding}
            style={{ width: '120px' }}
          >
            <LogoCarousel 
              height="40px"
              width="100%"
            />
          </div>
         
          {/* Project Dropdown - Always Rendered if Projects Exist */}
          {projectsList.length > 0 && (
            <div className="flex justify-center mx-2 flex-1 min-w-0">
              <ProjectsDropdown projects={projectsList} />
            </div>
          )}
          
          {/* Account Dropdown */}
          <div className="flex justify-end flex-shrink-0">
            <AccountDropdown
              userEmail={session?.user?.email}
              onAccount={() => {
                // Placeholder: navigate to account/profile page
                toast('Account clicked');
              }}
              onLogout={async () => {
                setMessages([]);
                await logout();
                toast.success('Logged out');
              }}
            />
          </div>
        </div>
      </header>
      <Outlet context={{ projectsList }} />
    </>
  );
}