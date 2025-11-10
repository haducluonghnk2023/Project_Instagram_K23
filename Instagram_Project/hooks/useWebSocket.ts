import { useEffect, useRef } from 'react';
import { websocketService, WebSocketMessage } from '@/services/websocket';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocket = (enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Connect WebSocket
    websocketService.connect();

    // Listen for new messages
    const handleNewMessage = (data: WebSocketMessage) => {
      if (data.type === 'new_message' && data.message) {
        const message = data.message;
        // Update the conversation cache
        queryClient.setQueryData(
          ['messages', 'conversation', message.fromUserId === data.userId ? message.toUserId : message.fromUserId],
          (oldMessages: any[]) => {
            if (!oldMessages) return [message];
            // Check if message already exists
            if (oldMessages.some((m) => m.id === message.id)) {
              return oldMessages;
            }
            return [...oldMessages, message];
          }
        );
        
        // Invalidate conversations list to update last message
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      } else if (data.type === 'message_sent' && data.message) {
        const message = data.message;
        // Update the conversation cache for sent message
        queryClient.setQueryData(
          ['messages', 'conversation', message.toUserId],
          (oldMessages: any[]) => {
            if (!oldMessages) return [message];
            // Check if message already exists
            if (oldMessages.some((m) => m.id === message.id)) {
              return oldMessages;
            }
            return [...oldMessages, message];
          }
        );
        
        // Invalidate conversations list
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      }
    };

    websocketService.on('message', handleNewMessage);

    return () => {
      websocketService.off('message', handleNewMessage);
      // Don't disconnect here - keep connection alive for other screens
    };
  }, [enabled, queryClient]);

  return {
    isConnected: websocketService.isConnected(),
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
  };
};

