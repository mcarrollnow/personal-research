"use client";

import React, { useState } from "react";
import Chat from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChatDemoPage() {
  const [userRole, setUserRole] = useState<'admin' | 'patient'>('patient');
  const [userId, setUserId] = useState('demo-patient-1');

  const switchToAdmin = () => {
    setUserRole('admin');
    setUserId('demo-admin-1');
  };

  const switchToPatient = () => {
    setUserRole('patient');
    setUserId('demo-patient-1');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Real-Time Messaging Demo</h1>
          <p className="text-muted-foreground">
            Test the Supabase-powered chat system with real-time updates
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Demo Controls
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {userRole === 'admin' ? 'Admin View' : 'Patient View'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Switch between admin and patient perspectives to test messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                variant={userRole === 'patient' ? 'default' : 'outline'}
                onClick={switchToPatient}
              >
                👤 Patient View
              </Button>
              <Button 
                variant={userRole === 'admin' ? 'default' : 'outline'}
                onClick={switchToAdmin}
              >
                👨‍⚕️ Admin View
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Current User:</h4>
              <div className="text-sm text-muted-foreground">
                <p><strong>ID:</strong> {userId}</p>
                <p><strong>Role:</strong> {userRole}</p>
                <p><strong>View:</strong> {userRole === 'admin' ? 'All patient conversations' : 'My conversations with care team'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">✅ Completed</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Real-time message sending/receiving</li>
                  <li>• Optimistic UI updates</li>
                  <li>• Loading states and error handling</li>
                  <li>• Conversation management</li>
                  <li>• Admin/Patient role switching</li>
                  <li>• Message persistence in Supabase</li>
                  <li>• Real-time subscriptions</li>
                  <li>• Beautiful existing UI preserved</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">🔄 In Progress</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Message priority indicators</li>
                  <li>• Typing indicators</li>
                  <li>• Message read receipts</li>
                  <li>• File attachments</li>
                  <li>• Push notifications</li>
                  <li>• Message search</li>
                  <li>• Conversation archiving</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            🚀 How to Test
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Click the chat bubble in the bottom right to open chat</li>
            <li>2. Switch between Admin/Patient views using buttons above</li>
            <li>3. Send messages and watch real-time updates</li>
            <li>4. Open multiple browser tabs to test real-time sync</li>
            <li>5. Test error handling by disconnecting internet</li>
          </ol>
        </div>
      </div>

      {/* Chat Component - positioned absolutely */}
      <Chat 
        userId={userId} 
        userRole={userRole}
        autoInitialize={true}
      />
    </div>
  );
}
