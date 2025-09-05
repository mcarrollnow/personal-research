"use client"

import React, { useEffect, useState } from "react";
import { adminAuthService } from "@/lib/admin-auth";
import { adminService } from "@/lib/admin-service";
import { messagingService } from "@/lib/messaging-service";
import DashboardCard from "@/components/dashboard/card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Send,
  Archive,
  Star,
  User,
  Calendar,
  Download,
  FileText,
  Trash2,
  Tag,
  SortAsc,
  SortDesc,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { ConversationSummary, MessagePriority } from "@/types/admin-chat";

interface InboxMessage extends ConversationSummary {
  selected: boolean;
  message_type: string;
  created_at: string;
  tags?: string[];
  archived?: boolean;
  starred?: boolean;
}

interface AdvancedSearchFilters {
  dateRange: {
    start: string;
    end: string;
  };
  messageTypes: string[];
  tags: string[];
  patientIds: string[];
  archived: boolean | null;
  starred: boolean | null;
}

export default function AdminInboxPage() {
  const [currentAdmin, setCurrentAdmin] = useState(adminAuthService.getCurrentAdmin());
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({
    dateRange: { start: "", end: "" },
    messageTypes: [],
    tags: [],
    patientIds: [],
    archived: null,
    starred: null
  });
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'patient' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  useEffect(() => {
    if (!currentAdmin) {
      setCurrentAdmin(adminAuthService.getCurrentAdmin());
    }
    loadMessages();
  }, [currentAdmin]);

  useEffect(() => {
    filterAndSortMessages();
  }, [messages, searchQuery, priorityFilter, statusFilter, advancedFilters, sortBy, sortOrder, showArchived]);

  useEffect(() => {
    setShowBulkActions(selectedMessages.length > 0);
  }, [selectedMessages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      if (!currentAdmin) return;

      // Load conversations from messaging service
      const conversationsResponse = await messagingService.getAdminConversations(
        currentAdmin.adminId,
        1,
        100
      );
      
      if (conversationsResponse.success && conversationsResponse.data) {
        const conversationsData = conversationsResponse.data.data;
        
        // Transform conversations into inbox messages
        const inboxMessages: InboxMessage[] = conversationsData.map((conv, index) => ({
          ...conv,
          selected: false,
          message_type: index % 3 === 0 ? 'safety' : index % 2 === 0 ? 'dosing' : 'general',
          created_at: conv.last_message_at
        }));
        
        setMessages(inboxMessages);
      } else {
        // Fallback to mock data
        const mockMessages: InboxMessage[] = [
          {
            id: "conv-1",
            patient_id: "PATIENT-001",
            patient_name: "John Smith",
            admin_id: currentAdmin.adminId,
            admin_name: currentAdmin.name,
            last_message_at: "2024-12-19T10:30:00Z",
            unread_count: 2,
            status: "active",
            last_message_preview: "I'm experiencing mild nausea after taking my dose this morning. Should I be concerned?",
            priority: "high",
            selected: false,
            message_type: "safety",
            created_at: "2024-12-19T10:30:00Z"
          },
          {
            id: "conv-2", 
            patient_id: "PATIENT-002",
            patient_name: "Sarah Johnson",
            admin_id: currentAdmin.adminId,
            admin_name: currentAdmin.name,
            last_message_at: "2024-12-19T09:15:00Z",
            unread_count: 1,
            status: "active",
            last_message_preview: "Can I adjust my injection time from evening to morning? My schedule has changed.",
            priority: "normal",
            selected: false,
            message_type: "dosing",
            created_at: "2024-12-19T09:15:00Z"
          },
          {
            id: "conv-3",
            patient_id: "PATIENT-003", 
            patient_name: "Mike Davis",
            admin_id: currentAdmin.adminId,
            admin_name: currentAdmin.name,
            last_message_at: "2024-12-19T08:45:00Z",
            unread_count: 0,
            status: "active",
            last_message_preview: "Thank you for the encouragement! I'm down 12 pounds and feeling great.",
            priority: "low",
            selected: false,
            message_type: "general",
            created_at: "2024-12-19T08:45:00Z"
          },
          {
            id: "conv-4",
            patient_id: "PATIENT-004",
            patient_name: "Lisa Chen",
            admin_id: currentAdmin.adminId,
            admin_name: currentAdmin.name,
            last_message_at: "2024-12-18T16:20:00Z",
            unread_count: 3,
            status: "active",
            last_message_preview: "I missed my dose yesterday. What should I do? Should I take two doses today?",
            priority: "urgent",
            selected: false,
            message_type: "dosing",
            created_at: "2024-12-18T16:20:00Z"
          }
        ];
        setMessages(mockMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMessages = () => {
    let filtered = messages;

    // Archive filter
    if (!showArchived) {
      filtered = filtered.filter(message => !message.archived);
    }

    // Basic search filter
    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.last_message_preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(message => message.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "unread") {
        filtered = filtered.filter(message => message.unread_count > 0);
      } else if (statusFilter === "read") {
        filtered = filtered.filter(message => message.unread_count === 0);
      }
    }

    // Advanced filters
    if (advancedFilters.dateRange.start) {
      filtered = filtered.filter(message => 
        new Date(message.created_at) >= new Date(advancedFilters.dateRange.start)
      );
    }

    if (advancedFilters.dateRange.end) {
      filtered = filtered.filter(message => 
        new Date(message.created_at) <= new Date(advancedFilters.dateRange.end)
      );
    }

    if (advancedFilters.messageTypes.length > 0) {
      filtered = filtered.filter(message => 
        advancedFilters.messageTypes.includes(message.message_type)
      );
    }

    if (advancedFilters.tags.length > 0) {
      filtered = filtered.filter(message => 
        message.tags?.some(tag => advancedFilters.tags.includes(tag))
      );
    }

    if (advancedFilters.patientIds.length > 0) {
      filtered = filtered.filter(message => 
        advancedFilters.patientIds.includes(message.patient_id)
      );
    }

    if (advancedFilters.starred !== null) {
      filtered = filtered.filter(message => 
        Boolean(message.starred) === advancedFilters.starred
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          comparison = aPriority - bPriority;
          break;
        case 'patient':
          comparison = a.patient_name.localeCompare(b.patient_name);
          break;
        case 'status':
          comparison = a.unread_count - b.unread_count;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredMessages(filtered);
  };

  // Archive/Unarchive messages
  const archiveMessages = async (messageIds: string[], archive: boolean = true) => {
    try {
      // Update local state immediately
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, archived: archive } : msg
      ));

      // TODO: Update in database
      // await messagingService.updateConversationStatus(messageIds, archive ? 'archived' : 'active');
      
      setSelectedMessages([]);
    } catch (error) {
      console.error('Error archiving messages:', error);
    }
  };

  // Star/Unstar messages
  const starMessages = async (messageIds: string[], starred: boolean = true) => {
    try {
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, starred } : msg
      ));

      // TODO: Update in database
      setSelectedMessages([]);
    } catch (error) {
      console.error('Error starring messages:', error);
    }
  };

  // Add tags to messages
  const addTagsToMessages = async (messageIds: string[], tags: string[]) => {
    try {
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) 
          ? { ...msg, tags: [...(msg.tags || []), ...tags].filter((tag, index, arr) => arr.indexOf(tag) === index) }
          : msg
      ));

      // Update available tags
      setAvailableTags(prev => [...new Set([...prev, ...tags])]);
      setSelectedMessages([]);
    } catch (error) {
      console.error('Error adding tags:', error);
    }
  };

  // Export conversations
  const exportConversations = async () => {
    try {
      const dataToExport = selectedMessages.length > 0 
        ? filteredMessages.filter(msg => selectedMessages.includes(msg.id))
        : filteredMessages;

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalConversations: dataToExport.length,
        conversations: dataToExport.map(msg => ({
          id: msg.id,
          patientName: msg.patient_name,
          patientId: msg.patient_id,
          lastMessage: msg.last_message_preview,
          lastMessageAt: msg.last_message_at,
          priority: msg.priority,
          status: msg.status,
          unreadCount: msg.unread_count,
          messageType: msg.message_type,
          tags: msg.tags || [],
          starred: msg.starred || false,
          archived: msg.archived || false
        }))
      };

      const filename = `conversations-export-${new Date().toISOString().split('T')[0]}`;

      switch (exportFormat) {
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          downloadFile(jsonBlob, `${filename}.json`);
          break;
        case 'csv':
          const csvContent = convertToCSV(exportData.conversations);
          const csvBlob = new Blob([csvContent], { type: 'text/csv' });
          downloadFile(csvBlob, `${filename}.csv`);
          break;
        case 'pdf':
          // TODO: Implement PDF export
          alert('PDF export not yet implemented');
          break;
      }

      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting conversations:', error);
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['ID', 'Patient Name', 'Patient ID', 'Last Message', 'Date', 'Priority', 'Status', 'Unread Count', 'Type', 'Tags'];
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        `"${row.patientName}"`,
        row.patientId,
        `"${row.lastMessage.replace(/"/g, '""')}"`,
        row.lastMessageAt,
        row.priority,
        row.status,
        row.unreadCount,
        row.messageType,
        `"${(row.tags || []).join(', ')}"`
      ].join(','))
    ];
    return csvRows.join('\n');
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setAdvancedFilters({
      dateRange: { start: "", end: "" },
      messageTypes: [],
      tags: [],
      patientIds: [],
      archived: null,
      starred: null
    });
    setSortBy('date');
    setSortOrder('desc');
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const selectAllMessages = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(m => m.id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    // In production, this would call the messaging service
    console.log('Marking messages as read:', selectedMessages);
    setSelectedMessages([]);
  };

  const handleBulkArchive = async () => {
    // In production, this would call the messaging service
    console.log('Archiving messages:', selectedMessages);
    setSelectedMessages([]);
  };

  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'normal': return 'outline';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'safety': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'dosing': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!currentAdmin) {
    return <div>Loading...</div>;
  }

  const unreadCount = messages.filter(m => m.unread_count > 0).length;
  const urgentCount = messages.filter(m => m.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Message Inbox</h1>
        <p className="text-muted-foreground mt-2">
          Manage all patient communications from one place
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <DashboardCard title="Search & Filter Messages" intent="default">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center gap-4 p-4 bg-accent rounded-lg">
              <span className="text-sm font-medium">
                {selectedMessages.length} message{selectedMessages.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Message List */}
      <DashboardCard title={`Messages (${filteredMessages.length})`} intent="default">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select All Header */}
            <div className="flex items-center gap-4 p-4 border-b">
              <Checkbox
                checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                onCheckedChange={selectAllMessages}
              />
              <span className="text-sm font-medium">Select All</span>
            </div>

            {filteredMessages.map((message) => (
              <Card 
                key={message.id} 
                className={`hover:shadow-md transition-shadow ${message.unread_count > 0 ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedMessages.includes(message.id)}
                      onCheckedChange={() => toggleMessageSelection(message.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{message.patient_name}</span>
                          </div>
                          
                          <Badge variant={getPriorityColor(message.priority)}>
                            {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}
                          </Badge>
                          
                          {message.unread_count > 0 && (
                            <Badge variant="default" className="bg-blue-500">
                              {message.unread_count} unread
                            </Badge>
                          )}
                          
                          {getMessageTypeIcon(message.message_type)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(message.last_message_at)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {message.last_message_preview}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Patient ID: {message.patient_id}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link href={`/admin/chat/${message.patient_id}`}>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
