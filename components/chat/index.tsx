"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useChatState } from "./use-chat-state";
import PlusIcon from "../icons/plus";
import ChatPreview from "./chat-preview";
import ChatConversation from "./chat-conversation";
import { ChatHeader } from "./chat-header";

const CONTENT_HEIGHT = 420; // Height of expandable content

// Props to allow initialization from parent components
interface ChatProps {
  userId?: string;
  userRole?: 'admin' | 'patient';
  autoInitialize?: boolean;
}

export default function Chat({ 
  userId = 'demo-patient-1', 
  userRole = 'patient',
  autoInitialize = true 
}: ChatProps) {
  const {
    chatState,
    conversations,
    newMessage,
    setNewMessage,
    activeConversation,
    isLoading,
    error,
    currentUser,
    initializeChat,
    handleSendMessage,
    openConversation,
    goBack,
    toggleExpanded,
    cleanup,
  } = useChatState();

  const isExpanded = chatState.state !== "collapsed";

  // Initialize chat when component mounts
  useEffect(() => {
    if (autoInitialize && userId) {
      initializeChat(userId, userRole);
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [userId, userRole, autoInitialize, initializeChat, cleanup]);

  // Loading State Component
  const LoadingState = () => (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col items-center justify-center p-8"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
      <p className="text-sm text-muted-foreground">Loading conversations...</p>
    </motion.div>
  );

  // Error State Component
  const ErrorState = () => (
    <motion.div
      key="error"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col items-center justify-center p-8"
    >
      <div className="text-destructive mb-4">⚠️</div>
      <p className="text-sm text-destructive text-center mb-4">{error}</p>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => initializeChat(userId, userRole)}
      >
        Retry
      </Button>
    </motion.div>
  );

  // Empty State Component
  const EmptyState = () => (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col items-center justify-center p-8"
    >
      <div className="text-muted-foreground mb-4">💬</div>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {userRole === 'admin' 
          ? 'No patient conversations yet' 
          : 'No messages yet. Your care team will reach out soon.'}
      </p>
      {userRole === 'admin' && (
        <Button size="sm" variant="outline">
          Start New Conversation
        </Button>
      )}
    </motion.div>
  );

  return (
    <motion.div
      className="absolute bottom-0 inset-x-0 z-50"
      initial={{ y: CONTENT_HEIGHT }}
      animate={{ y: isExpanded ? 0 : CONTENT_HEIGHT }}
      transition={{ duration: 0.3, ease: "circInOut" }}
    >
      {/* Shared Morphing Header - Always at the top */}
      <ChatHeader
        variant="desktop"
        onClick={toggleExpanded}
        showBackButton={chatState.state === "conversation"}
        onBackClick={goBack}
      />

      {/* Expandable Content - Below the header */}
      <div className="pt-1 overflow-y-auto" style={{ height: CONTENT_HEIGHT }}>
        <div className="bg-background text-foreground h-full">
          <AnimatePresence mode="wait">
            {chatState.state === "expanded" && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {/* Show loading, error, or conversations */}
                {isLoading ? (
                  <LoadingState />
                ) : error ? (
                  <ErrorState />
                ) : conversations.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {/* Conversations List */}
                    <div className="flex-1 flex flex-col overflow-y-auto">
                      {conversations.map((conversation) => (
                        <ChatPreview
                          key={conversation.id}
                          conversation={conversation}
                          onOpenConversation={openConversation}
                        />
                      ))}

                      {/* Footer */}
                      <div className="mt-auto flex justify-end p-4 sticky bottom-0 bg-gradient-to-t from-background via-background/80 to-black/0">
                        <Button
                          size="lg"
                          variant="secondary"
                          className="pl-0 py-0 gap-4 overflow-clip"
                          disabled={userRole !== 'admin'} // Only admins can start new chats
                          onClick={() => {
                            // TODO: Implement new conversation creation
                            // For now, show a placeholder
                            alert('New conversation feature coming in Chunk 5! For now, you can test with existing conversations or create test data in Supabase.');
                          }}
                        >
                          <div className="bg-primary text-primary-foreground h-full aspect-square border-r-2 border-background flex items-center justify-center">
                            <PlusIcon className="size-4" />
                          </div>
                          New Chat
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {chatState.state === "conversation" && activeConversation && (
              <ChatConversation
                activeConversation={activeConversation}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                error={error}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
