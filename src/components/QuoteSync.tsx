import { useEffect } from 'react';
import { useMessaging } from '../contexts/Messaging/MessagingProvider';
import { useQuotes } from '../contexts/QuoteProvider';

/**
 * Component that syncs the MessagingProvider conversation ID with the QuoteProvider
 * This avoids circular dependencies while allowing the two providers to work together
 */
export const QuoteSync: React.FC = () => {
  const { currentConversationId } = useMessaging();
  const { setCurrentConversationId } = useQuotes();
  
  // Sync the conversation ID from MessagingProvider to QuoteProvider
  useEffect(() => {
    setCurrentConversationId(currentConversationId);
  }, [currentConversationId, setCurrentConversationId]);

  // Render nothing - this is just a logical component
  return null;
};

export default QuoteSync;
