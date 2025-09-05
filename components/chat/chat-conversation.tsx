import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatConversation as ChatConversationType } from "@/types/chat";
import { formatDate, formatTime } from "./utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import ArrowRightIcon from "../icons/arrow-right";
import { Badge } from "../ui/badge";

const MESSAGE_GROUP_THRESHOLD = 3 * 60 * 1000; // 3 minutes in milliseconds

interface ChatConversationProps {
  activeConversation: ChatConversationType;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface MessageGroup {
  messages: ChatMessageType[];
  timestamp: string;
  isFromCurrentUser: boolean;
}

export default function ChatConversation({
  activeConversation,
  newMessage,
  setNewMessage,
  onSendMessage,
  isLoading = false,
  error = null,
}: ChatConversationProps) {
  // Group messages by time and sender
  const groupMessages = (messages: ChatMessageType[]): MessageGroup[] => {
    const groups: MessageGroup[] = [];

    messages.forEach((message) => {
      const lastGroup = groups[groups.length - 1];
      const messageTime = new Date(message.timestamp).getTime();

      if (
        lastGroup &&
        lastGroup.isFromCurrentUser === message.isFromCurrentUser &&
        messageTime - new Date(lastGroup.timestamp).getTime() <=
          MESSAGE_GROUP_THRESHOLD
      ) {
        // Add to existing group
        lastGroup.messages.push(message);
      } else {
        // Create new group
        groups.push({
          messages: [message],
          timestamp: message.timestamp,
          isFromCurrentUser: message.isFromCurrentUser,
        });
      }
    });

    return groups;
  };

  const messageGroups = groupMessages(activeConversation.messages);
  const otherParticipant = activeConversation.participants.find(
    (p) => p.name !== "JOYBOY" // TODO: Use actual current user
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { isLoading, newMessage: newMessage.trim() });
    if (!isLoading && newMessage.trim()) {
      console.log('Calling onSendMessage...');
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      key="conversation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      {/* Conversation Header */}
      <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {otherParticipant?.avatar ? (
              <img 
                src={otherParticipant.avatar} 
                alt={otherParticipant.name || "User"} 
                className="w-full h-full object-cover"
              />
            ) : (
              otherParticipant?.name?.[0] || "?"
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {otherParticipant?.name || "Unknown User"}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">
                {otherParticipant?.role === 'admin' ? 'Care Team' : 'Patient'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-muted-foreground">
              <div className="text-2xl mb-2">👋</div>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={cn(
                "flex flex-col gap-1",
                group.isFromCurrentUser ? "items-end" : "items-start"
              )}
            >
              {/* Timestamp */}
              <div className="text-xs text-muted-foreground px-3 mb-1">
                {formatDate(group.timestamp)} • {formatTime(group.timestamp)}
              </div>

              {/* Messages in group */}
              {group.messages.map((message, messageIndex) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: messageIndex * 0.05,
                    ease: "easeOut" 
                  }}
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                    group.isFromCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    messageIndex === 0
                      ? group.isFromCurrentUser
                        ? "rounded-tr-sm"
                        : "rounded-tl-sm"
                      : "",
                    messageIndex === group.messages.length - 1
                      ? group.isFromCurrentUser
                        ? "rounded-br-sm"
                        : "rounded-bl-sm"
                      : ""
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-1">{message.content}</span>
                    {message.priority && message.priority !== 'normal' && (
                      <Badge 
                        variant={message.priority === 'urgent' ? 'destructive' : 'secondary'}
                        className="text-xs ml-2"
                      >
                        {message.priority}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Show optimistic loading for messages being sent */}
                  {message.id.startsWith('optimistic-') && (
                    <div className="flex items-center gap-1 mt-1 opacity-60">
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                      <span className="text-xs">Sending...</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoading ? "Sending..." : "Type a message..."}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRightIcon className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
