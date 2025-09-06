# Results Pro - Development Chunk Prompts
**Ready-to-copy prompts for starting each development session**

## 📋 **CHUNK 1: Data Structure & Supabase Integration** ✅ **COMPLETE**
```
I want to work on Chunk 1: Data Structure & Google Sheets Extension for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

I've completed Supabase setup:
- 4 tables created: messages, conversations, admin_users, message_templates
- Row Level Security policies applied
- Real-time subscriptions enabled
- Environment variables configured
- Dependencies installed

Current architecture:
- Google Sheets = Health data only (6 sheets, 78+ columns)
- Supabase = Messaging data only (4 tables, real-time)

Now implement Chunk 1 tasks:
- Create Supabase client service
- Create messaging TypeScript types
- Create messaging service layer
- NO Google Sheets extension for messaging (keep health data separate)

At the end, create update log: 002_Supabase_Messaging_Integration_2024-09-04.md using UPDATE_LOG_TEMPLATE.md
```

## 📋 **CHUNK 2: Admin Authentication & Routing** ✅ **COMPLETE**
```
I want to work on Chunk 2: Admin Authentication & Routing for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunk 1):
- Supabase messaging service created
- Message TypeScript types defined
- Real-time messaging infrastructure ready

Now implement Chunk 2 tasks:
- Extend PatientAuthService for admin roles
- Create admin login page (/admin/login)
- Create admin layout component
- Implement route protection for admin pages

Use existing styling patterns from patient pages.
At the end, create update log: 003_Admin_Authentication_2024-09-04.md
```

## 📋 **CHUNK 3: Admin Dashboard & Patient List**
```
I want to work on Chunk 3: Admin Dashboard & Patient List for Results Pro.


Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunks 1-2):
- Supabase messaging service ready
- Admin authentication working
- Admin routes protected

Now implement Chunk 3 tasks:
- Create admin dashboard (/admin/dashboard)
- Create patient management page (/admin/patients)
- Create message inbox (/admin/inbox)
- Use existing DashboardCard components for consistency

At the end, create update log: 004_Admin_Dashboard_2025-09-04.md
```

## 📋 **CHUNK 4: Real-Time Messaging Core**
```
I want to work on Chunk 4: Real-Time Messaging Core for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunks 1-3):
- Supabase messaging service created
- Admin authentication and dashboard ready
- Patient management interface built

Now implement Chunk 4 tasks:
- Connect existing chat UI to Supabase backend
- Update chat state management for real data
- Implement real-time subscriptions
- Connect admin-patient messaging bridge

Existing chat UI is in components/chat/ - keep all styling and animations.
At the end, create update log: 005_Real_Time_Messaging_2025-09-04.md
```

## 📋 **CHUNK 5: Admin Message Features**
```
I want to work on Chunk 5: Admin Message Features for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunks 1-4):
- Real-time messaging working
- Admin and patients can exchange messages
- Chat UI connected to Supabase

Now implement Chunk 5 tasks:
- Individual patient chat pages (/admin/chat/[patientId])
- Broadcast messaging (/admin/broadcast)
- Message templates and quick replies
- Priority and categorization system

At the end, create update log: 006_Admin_Message_Features_2024-09-04.md
```

## 📋 **CHUNK 6: Advanced Admin Features**
```
I want to work on Chunk 6: Advanced Admin Features for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunks 1-5):
- Individual patient chats working
- Broadcast messaging functional
- Message templates available

Now implement Chunk 6 tasks:
- Admin analytics dashboard
- Automated messaging system
- Notification system
- Message search and archive

At the end, create update log: 007_Advanced_Admin_Features_2024-09-04.md
```

## 📋 **CHUNK 7: Integration & Polish**
```
I want to work on Chunk 7: Integration & Polish for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunks 1-6):
- Full admin messaging system working
- Analytics and automation ready
- Notification system functional

Now implement Chunk 7 tasks:
- Integrate messaging with safety alerts
- Connect to progress milestones
- Add compliance messaging workflows
- Mobile optimization for admin features

At the end, create update log: 008_Integration_Polish_2024-09-04.md
```

## 📋 **CHUNK 8: Testing & Deployment**
```
I want to work on Chunk 8: Testing & Deployment for Results Pro.

Reference ADMIN_CHAT_BUILD_PLAN.md for the complete plan.

Previous work completed (Chunks 1-7):
- Complete messaging system with integrations
- All admin features functional
- Mobile optimization complete

Now implement Chunk 8 tasks:
- End-to-end testing of messaging workflows
- Production deployment optimization
- Create admin documentation
- Final system validation

At the end, create update log: 009_Testing_Deployment_2024-09-04.md
```

---

## 🎯 **How to Use:**

1. **Copy the relevant chunk prompt** from above
2. **Paste into new chat session**
3. **Update the date** in the update log filename
4. **Agent will have perfect context** and clear instructions!

**Now you have shortcuts for every development session!** 🚀
