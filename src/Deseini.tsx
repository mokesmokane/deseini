import LogoCarousel from './components/LogoCarousel';
import toast, { Toaster } from 'react-hot-toast';
import { Outlet, useNavigate } from 'react-router-dom';
import AccountDropdown  from './components/AccountDropdown';
import { ProjectsDropdown } from './components/ProjectsDropdown';
import { useProject } from './contexts/ProjectContext';
import { useMessaging } from './contexts/Messaging/MessagingProvider';
import { useDraftMarkdown } from './components/landing/DraftMarkdownProvider';
import { useAuth } from './hooks/useAuth';


export default function Deseini() {
  const {projectsList, setNoProject} = useProject();
  const navigate = useNavigate();
  const {session, logout} = useAuth();
  const {setMessages} = useMessaging();
  const {resetMarkdown} = useDraftMarkdown();

  const navigateToLanding = () => {
    setNoProject();
    setMessages([]);
    resetMarkdown();
    navigate('/');
  };

  return (
    <>
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm w-full border-b border-gray-200 h-16 flex-shrink-0">
        <div className="py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div 
            className="cursor-pointer flex items-center" 
            onClick={navigateToLanding}
            style={{ minWidth: '150px' }} // Adjust width as needed
          >
            <LogoCarousel 
              height="40px"
              width="100%"
            />
          </div>
         
          {/* Project Dropdown - Always Rendered if Projects Exist */}
          {projectsList.length > 0 && (
            <div className="flex-1 flex justify-start px-4">
              <ProjectsDropdown projects={projectsList} />
            </div>
          )}
          
          {/* Account Dropdown */}
          <div style={{ minWidth: '150px' }} className="flex justify-end">
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