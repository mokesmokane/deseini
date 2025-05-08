import React, { useEffect } from 'react';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useQuotes } from '../../../contexts/QuoteProvider';

/**
 * This component syncs the conversation ID from MessagingProvider to QuoteProvider
 * It should be mounted inside the app where both providers are available
 */
export const QuoteSyncComponent: React.FC = () => {
  const { currentConversationId } = useMessaging();
  const { setCurrentConversationId } = useQuotes();

  // Sync the conversation ID whenever it changes
  useEffect(() => {
    setCurrentConversationId(currentConversationId);
  }, [currentConversationId, setCurrentConversationId]);

  // This component doesn't render anything
  return null;
};

export default QuoteSyncComponent;
