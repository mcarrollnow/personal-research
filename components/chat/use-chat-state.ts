import { create } from "zustand";
import type { ChatState, ChatMessage, ChatConversation, ChatUser } from "@/types/chat";
import { chatService } from "@/lib/chat-service";
// Remove mock data import - we'll use real data now
// import { mockChatData } from "@/data/chat-mock";

type ChatComponentState = {
  state: ChatState;
  activeConversation?: string;
};

interface ChatStore {
  // State
  chatState: ChatComponentState;
  conversations: ChatConversation[];
  newMessage: string;
  isLoading: boolean;
  error: string | null;
  currentUser: ChatUser | null;
  realtimeSubscription: any;

  // Actions
  setChatState: (state: ChatComponentState) => void;
  setConversations: (conversations: ChatConversation[]) => void;
  setNewMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeChat: (userId: string, role?: 'admin' | 'patient') => Promise<void>;
  loadConversations: () => Promise<void>;
  handleSendMessage: () => Promise<void>;
  openConversation: (conversationId: string) => void;
  goBack: () => void;
  toggleExpanded: () => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateConversationUnreadCount: (conversationId: string, count: number) => void;
  cleanup: () => void;
}

const chatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chatState: {
    state: "collapsed",
  },
  conversations: [],
  newMessage: "",
  isLoading: false,
  error: null,
  currentUser: null,
  realtimeSubscription: null,

  // Actions
  setChatState: (chatState) => set({ chatState }),

  setConversations: (conversations) => set({ conversations }),

  setNewMessage: (newMessage) => set({ newMessage }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Initialize chat service and load data
  initializeChat: async (userId: string, role: 'admin' | 'patient' = 'patient') => {
    const { setLoading, setError, loadConversations } = get();
    
    try {
      setLoading(true);
      setError(null);

      // Initialize chat service
      await chatService.initialize(userId, role);
      
      // Set current user
      const currentUser = chatService.getCurrentUser();
      set({ currentUser });

      // Load conversations
      await loadConversations();

      // Set up real-time subscriptions
      console.log('Setting up real-time subscription for user:', userId, 'role:', role);
      const subscription = chatService.subscribeToAllConversations(
        (type, data) => {
          console.log('Real-time event received for user:', userId, { type, data });
          
          if (type === 'new_message') {
            const message = data as ChatMessage;
            console.log('Processing new message for user:', userId, message);
            
            // Use setTimeout to avoid render loop issues
            setTimeout(() => {
              chatService.getConversations().then(updatedConversations => {
                console.log('Updated conversations loaded for user:', userId, updatedConversations.length);
                set({ conversations: updatedConversations });
              });
            }, 0);
          }
        },
        (error) => {
          console.error('Real-time subscription error:', error);
          setTimeout(() => {
            setError('Connection error. Messages may not update in real-time.');
          }, 0);
        }
      );

      set({ realtimeSubscription: subscription });
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  },

  // Load conversations from Supabase
  loadConversations: async () => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      const conversations = await chatService.getConversations();
      set({ conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  },

  // Send message with optimistic updates
  handleSendMessage: async () => {
    const { newMessage, conversations, chatState, currentUser } = get();
    const activeConv = conversations.find(
      (conv) => conv.id === chatState.activeConversation
    );

    if (!newMessage.trim() || !activeConv || !currentUser) return;

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderId: currentUser.id,
      isFromCurrentUser: true,
    };

    // Add optimistic message immediately
    const updatedConversations = conversations.map((conv) =>
      conv.id === activeConv.id
        ? {
            ...conv,
            messages: [...conv.messages, optimisticMessage],
            lastMessage: optimisticMessage,
          }
        : conv
    );

    set({
      conversations: updatedConversations,
      newMessage: "",
    });

    try {
      // Get the other participant to send message to
      const otherParticipant = chatService.getOtherParticipant(activeConv);
      if (!otherParticipant) {
        throw new Error('No recipient found');
      }

      // Send real message
      const sentMessage = await chatService.sendMessage(
        activeConv.id,
        newMessage.trim(),
        otherParticipant.id
      );

      if (sentMessage) {
        // Replace optimistic message with real message
        const finalConversations = get().conversations.map((conv) =>
          conv.id === activeConv.id
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === optimisticMessage.id ? sentMessage : msg
                ),
                lastMessage: sentMessage,
              }
            : conv
        );
        set({ conversations: finalConversations });
      } else {
        // Remove optimistic message on failure
        const revertedConversations = get().conversations.map((conv) =>
          conv.id === activeConv.id
            ? {
                ...conv,
                messages: conv.messages.filter((msg) => msg.id !== optimisticMessage.id),
                lastMessage: conv.messages.length > 1 
                  ? conv.messages[conv.messages.length - 2] 
                  : conv.lastMessage,
              }
            : conv
        );
        set({ 
          conversations: revertedConversations,
          error: 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      const revertedConversations = get().conversations.map((conv) =>
        conv.id === activeConv.id
          ? {
              ...conv,
              messages: conv.messages.filter((msg) => msg.id !== optimisticMessage.id),
              lastMessage: conv.messages.length > 1 
                ? conv.messages[conv.messages.length - 2] 
                : conv.lastMessage,
            }
          : conv
      );
      set({ 
        conversations: revertedConversations,
        error: 'Failed to send message. Please check your connection.'
      });
    }
  },

  openConversation: (conversationId) => {
    const { conversations } = get();

    // Update chat state
    set({
      chatState: { state: "conversation", activeConversation: conversationId },
      error: null // Clear any previous errors
    });

    // Mark conversation as read
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    );

    set({ conversations: updatedConversations });

    // Mark as read in backend
    chatService.markConversationAsRead(conversationId);
  },

  goBack: () => {
    const { chatState } = get();
    if (chatState.state === "conversation") {
      set({ chatState: { state: "expanded" } });
    } else {
      set({ chatState: { state: "collapsed" } });
    }
  },

  toggleExpanded: () => {
    const { chatState } = get();
    set({
      chatState: {
        state: chatState.state === "collapsed" ? "expanded" : "collapsed",
      },
    });
  },

  // Add message to specific conversation (for real-time updates)
  addMessage: (conversationId: string, message: ChatMessage) => {
    const { conversations } = get();
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId
        ? {
            ...conv,
            messages: [...conv.messages, message],
            lastMessage: message,
            unreadCount: message.isFromCurrentUser ? conv.unreadCount : conv.unreadCount + 1,
          }
        : conv
    );
    set({ conversations: updatedConversations });
  },

  // Update unread count for a conversation
  updateConversationUnreadCount: (conversationId: string, count: number) => {
    const { conversations } = get();
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, unreadCount: count } : conv
    );
    set({ conversations: updatedConversations });
  },

  // Cleanup subscriptions
  cleanup: () => {
    const { realtimeSubscription } = get();
    if (realtimeSubscription) {
      chatService.cleanup();
      set({ realtimeSubscription: null });
    }
  }
}));

// Hook with computed values using selectors
export const useChatState = () => {
  const chatState = chatStore((state) => state.chatState);
  const conversations = chatStore((state) => state.conversations);
  const newMessage = chatStore((state) => state.newMessage);
  const isLoading = chatStore((state) => state.isLoading);
  const error = chatStore((state) => state.error);
  const currentUser = chatStore((state) => state.currentUser);
  
  const setChatState = chatStore((state) => state.setChatState);
  const setConversations = chatStore((state) => state.setConversations);
  const setNewMessage = chatStore((state) => state.setNewMessage);
  const initializeChat = chatStore((state) => state.initializeChat);
  const loadConversations = chatStore((state) => state.loadConversations);
  const handleSendMessage = chatStore((state) => state.handleSendMessage);
  const openConversation = chatStore((state) => state.openConversation);
  const goBack = chatStore((state) => state.goBack);
  const toggleExpanded = chatStore((state) => state.toggleExpanded);
  const cleanup = chatStore((state) => state.cleanup);

  // Computed values
  const totalUnreadCount = conversations.reduce(
    (total, conv) => total + conv.unreadCount,
    0
  );

  const activeConversation = conversations.find(
    (conv) => conv.id === chatState.activeConversation
  );

  return {
    chatState,
    conversations,
    newMessage,
    isLoading,
    error,
    currentUser,
    totalUnreadCount,
    activeConversation,
    setChatState,
    setConversations,
    setNewMessage,
    initializeChat,
    loadConversations,
    handleSendMessage,
    openConversation,
    goBack,
    toggleExpanded,
    cleanup,
  };
};
