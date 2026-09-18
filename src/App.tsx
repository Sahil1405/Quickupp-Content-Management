import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  ContentItem, 
  OperationalMetrics, 
  ActivityLog, 
  ContentIssue, 
  AppNotification,
  IssueType
} from './types';
import { api } from './lib/api';
import { Topbar } from './components/Topbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { EditorDashboard } from './components/EditorDashboard';
import { PosterDashboard } from './components/PosterDashboard';
import { CalendarView } from './components/CalendarView';
import { TeamManagement } from './components/TeamManagement';
import { ActivityLogView } from './components/ActivityLogView';
import { SettingsView } from './components/SettingsView';
import { ContentDetailModal } from './components/ContentDetailModal';
import { CreateContentModal } from './components/CreateContentModal';
import { PostingConfirmModal } from './components/PostingConfirmModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { RevisionModal } from './components/RevisionModal';
import { MoveDateModal } from './components/MoveDateModal';
import { TaskNotificationToast } from './components/TaskNotificationToast';
import { 
  playNotificationSound, 
  sendDesktopNotification, 
  initAudioOnGesture,
  registerNotificationServiceWorker,
  requestBrowserNotificationPermission
} from './lib/notificationService';
import { Loader2, ShieldAlert, BellRing } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToastNotification, setActiveToastNotification] = useState<AppNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Track known notifications so we only trigger chime on new arrivals
  const knownNotificationIdsRef = React.useRef<Set<string>>(new Set());

  // Modal States
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>(undefined);
  const [postingModalContent, setPostingModalContent] = useState<ContentItem | null>(null);
  const [issueModalContent, setIssueModalContent] = useState<ContentItem | null>(null);
  const [revisionModalContent, setRevisionModalContent] = useState<ContentItem | null>(null);
  const [moveDateModalContent, setMoveDateModalContent] = useState<ContentItem | null>(null);
  const [moveDateTargetDate, setMoveDateTargetDate] = useState<string | undefined>(undefined);

  // Initial Load
  const loadInitialData = useCallback(async () => {
    try {
      const [usersRes, contentRes, fetchedMetrics, logsRes, issuesRes, notifsRes] =
        await Promise.all([
          api.getUsers(),
          api.getContent(),
          api.getMetrics(),
          api.getActivity(),
          api.getIssues(),
          api.getNotifications(),
        ]);

      const fetchedUsers = usersRes.users;
      setUsers(fetchedUsers);
      setContentList(contentRes.content);
      setMetrics(fetchedMetrics);
      setActivityLogs(logsRes.activity_logs);
      setIssues(issuesRes.issues);
      setNotifications(notifsRes.notifications);
      notifsRes.notifications.forEach((n: AppNotification) => knownNotificationIdsRef.current.add(n.id));

      if (!currentUser && fetchedUsers.length > 0) {
        // Default to workspace admin
        const defaultAdmin = fetchedUsers.find((u: User) => u.role === 'admin') || fetchedUsers[0];
        setCurrentUser(defaultAdmin);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const [dismissedPermBanner, setDismissedPermBanner] = useState(false);

  useEffect(() => {
    loadInitialData();
    initAudioOnGesture();
    registerNotificationServiceWorker();

    // Listen for service worker notification click navigation
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'OPEN_TASK' && event.data.contentId) {
          const targetId = event.data.contentId;
          api.getContent().then((res) => {
            const match = res.content.find((c: any) => c.id === targetId);
            if (match) setSelectedContent(match);
          });
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [loadInitialData]);

  // Real-time Global Workflow Notification Listener:
  // Polls server every 3s. Whenever any task is published, completed, reviewed & flagged for revision,
  // an issue reported, or assigned, it triggers a screen pop-up, melodic chime, and visual toast for all persons.
  useEffect(() => {
    if (!currentUser) return;

    const pollInterval = setInterval(async () => {
      try {
        const notifsRes = await api.getNotifications();
        const latestNotifs: AppNotification[] = notifsRes.notifications || [];

        // Check for new notifications directed at this user that haven't been alerted yet
        const newUnseen = latestNotifs.filter(
          (n) => !n.read && n.user_id === currentUser.id && !knownNotificationIdsRef.current.has(n.id)
        );

        if (newUnseen.length > 0) {
          const newest = newUnseen[0];
          newUnseen.forEach((n) => knownNotificationIdsRef.current.add(n.id));

          // 1. Synthesize audio chime
          playNotificationSound();

          // 2. Dispatch native desktop screen pop-up (appears even if minimized or on another tab/window)
          sendDesktopNotification(newest.title, {
            body: newest.message,
            tag: newest.id,
            contentId: newest.content_id,
            onClick: () => {
              if (newest.content_id) {
                api.getContent().then((res) => {
                  const item = res.content.find((c: any) => c.id === newest.content_id);
                  if (item) setSelectedContent(item);
                });
              }
            },
          });

          // 3. Trigger in-app toast
          setActiveToastNotification(newest);

          // 4. Update notification state list
          setNotifications(latestNotifs);

          // 5. Trigger light background refresh so kanban & metrics update immediately
          refreshData();
        }
      } catch {
        // quiet fail on transient network poll
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentUser]);

  // Refresh data helper
  const refreshData = async () => {
    try {
      const [contentRes, fetchedMetrics, logsRes, issuesRes, notifsRes] =
        await Promise.all([
          api.getContent(),
          api.getMetrics(),
          api.getActivity(),
          api.getIssues(),
          api.getNotifications(),
        ]);
      setContentList(contentRes.content);
      setMetrics(fetchedMetrics);
      setActivityLogs(logsRes.activity_logs);
      setIssues(issuesRes.issues);
      setNotifications(notifsRes.notifications);
      notifsRes.notifications.forEach((n: AppNotification) => knownNotificationIdsRef.current.add(n.id));

      // Keep selected content in sync if open
      if (selectedContent) {
        const updated = contentRes.content.find((c: ContentItem) => c.id === selectedContent.id);
        if (updated) setSelectedContent(updated);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  // Switch user helper
  const handleSwitchUser = async (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (!found) return;

    await api.switchUser(userId);
    setCurrentUser(found);

    if (found.role === 'editor') {
      setCurrentTab('my_work');
    } else if (found.role === 'poster') {
      setCurrentTab('posting_queue');
    } else {
      setCurrentTab('dashboard');
    }
    await refreshData();
  };

  // Content Operations Handlers
  const handleCreateContent = async (contentData: Partial<ContentItem>) => {
    if (!currentUser) return;
    await api.createContent({
      ...contentData,
      created_by: currentUser.id,
    });
    await refreshData();
  };

  const handleUploadVideo = async (file: File, onProgress: (pct: number) => void) => {
    if (!selectedContent) return;
    await api.uploadVideo(selectedContent.id, file, onProgress);
    await refreshData();
  };

  const handleConfirmPosting = async (data: {
    post_url?: string;
    posted_at?: string;
    posting_notes?: string;
    platform?: string;
  }) => {
    const targetItem = postingModalContent || selectedContent;
    if (!targetItem) return;

    await api.markPosted(targetItem.id, data);
    await refreshData();
  };

  const handleRequestRevision = async (notes: string) => {
    const targetItem = revisionModalContent || selectedContent;
    if (!targetItem) return;

    await api.requestRevision(targetItem.id, notes);
    await refreshData();
  };

  const handleSubmitIssue = async (data: { issue_type: IssueType; description: string }) => {
    const targetItem = issueModalContent || selectedContent;
    if (!targetItem) return;

    await api.reportIssue(targetItem.id, data);
    await refreshData();
  };

  const handleResolveIssue = async (issueId: string) => {
    await api.resolveIssue(issueId);
    await refreshData();
  };

  const handleMoveDate = async (newDate: string) => {
    const targetItem = moveDateModalContent || selectedContent;
    if (!targetItem) return;

    await api.updateContent(targetItem.id, { scheduled_date: newDate });
    await refreshData();
  };

  const handleDuplicateContent = async () => {
    if (!selectedContent) return;
    const res = await api.duplicateContent(selectedContent.id);
    await refreshData();
    setSelectedContent(res.content);
  };

  const handleDeleteContent = async () => {
    if (!selectedContent) return;
    if (window.confirm(`Are you sure you want to delete "${selectedContent.title}"?`)) {
      await api.deleteContent(selectedContent.id);
      setSelectedContent(null);
      await refreshData();
    }
  };

  const handleAddUser = async (userData: Partial<User>) => {
    await api.createUser(userData);
    const updated = await api.getUsers();
    setUsers(updated.users);
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    await api.updateUser(userId, data);
    const updated = await api.getUsers();
    setUsers(updated.users);
  };

  // Filter content based on search query
  const displayedContent = searchQuery.trim()
    ? contentList.filter(
        c =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.hashtags.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contentList;

  if (isLoading || !currentUser || !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800 mb-2" />
        <p className="text-sm font-medium">Booting ContentFlow workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Global Topbar */}
      <Topbar
        currentUser={currentUser}
        allUsers={users}
        notifications={notifications}
        onSwitchUser={handleSwitchUser}
        onMarkNotificationRead={async (id) => {
          await api.markNotificationRead(id);
          const notifsRes = await api.getNotifications();
          setNotifications(notifsRes.notifications);
        }}
        onMarkAllNotificationsRead={async () => {
          await api.markAllNotificationsRead();
          const notifsRes = await api.getNotifications();
          setNotifications(notifsRes.notifications);
        }}
        onSelectContentById={(contentId) => {
          const item = contentList.find(c => c.id === contentId);
          if (item) setSelectedContent(item);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenCreateModal={() => {
          setCreateDefaultDate(undefined);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Screen Pop-up Notification Permission Banner */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && !dismissedPermBanner && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-blue-800 shadow-inner sticky top-[57px] z-20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-blue-800/80 text-blue-200 shrink-0">
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
            </span>
            <span className="truncate">
              <strong>Global Screen Pop-ups:</strong> Enable browser notifications to get alerts on your screen whenever a task is published, completed, reviewed, or assigned.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                const res = await requestBrowserNotificationPermission();
                playNotificationSound();
                if (res === 'granted') {
                  sendDesktopNotification('🚀 Screen Pop-up Alerts Enabled!', {
                    body: 'You will now receive desktop pop-ups with chime whenever tasks are published, completed, reviewed, or assigned.',
                  });
                }
                setDismissedPermBanner(true);
              }}
              className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-950 font-bold rounded-lg shadow-sm transition-colors text-xs"
            >
              Enable Screen Pop-ups
            </button>
            <button
              onClick={() => setDismissedPermBanner(true)}
              className="text-blue-300 hover:text-white text-xs px-1.5 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Role-Based Security Enforcement Indicator Banner */}
      {currentUser.role !== 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-300/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-950 sticky top-[57px] z-20 backdrop-blur bg-amber-50/95">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-amber-200/80 text-amber-900 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">
              <strong>Role Security Active:</strong> Operating as <u>{currentUser.name}</u> ({currentUser.role === 'editor' ? 'Video Editor' : 'Posting Intern'}). Tasks, schedules, and assets generated by Admins are strictly read-only and cannot be altered.
            </span>
          </div>
          {users.find(u => u.role === 'admin') && (
            <button
              onClick={() => {
                const admin = users.find(u => u.role === 'admin');
                if (admin) handleSwitchUser(admin.id);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors shrink-0 shadow-2xs"
            >
              Return to Admin
            </button>
          )}
        </div>
      )}

      {/* Floating Real-Time Assignment Alert Toast */}
      <TaskNotificationToast
        notification={activeToastNotification}
        onClose={() => setActiveToastNotification(null)}
        onOpenTask={(contentId) => {
          const item = contentList.find(c => c.id === contentId);
          if (item) setSelectedContent(item);
        }}
      />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          metrics={metrics}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          {/* TAB 1: DASHBOARD (Adapts to Role) */}
          {currentTab === 'dashboard' && currentUser.role === 'admin' && (
            <AdminDashboard
              metrics={metrics}
              contentList={displayedContent}
              allUsers={users}
              issues={issues}
              onSelectContent={setSelectedContent}
              onOpenCreateModal={() => {
                setCreateDefaultDate(undefined);
                setIsCreateModalOpen(true);
              }}
              onNavigateToCalendar={() => setCurrentTab('calendar')}
            />
          )}

          {currentTab === 'dashboard' && currentUser.role === 'editor' && (
            <EditorDashboard
              currentUser={currentUser}
              allContent={displayedContent}
              allUsers={users}
              onSelectContent={setSelectedContent}
            />
          )}

          {currentTab === 'dashboard' && currentUser.role === 'poster' && (
            <PosterDashboard
              currentUser={currentUser}
              allContent={displayedContent}
              allUsers={users}
              onSelectContent={setSelectedContent}
              onOpenPostingModal={(item) => setPostingModalContent(item)}
              onOpenIssueModal={(item) => setIssueModalContent(item)}
            />
          )}

          {/* TAB 2: CALENDAR */}
          {currentTab === 'calendar' && (
            <CalendarView
              contentList={displayedContent}
              allUsers={users}
              currentUser={currentUser}
              onSelectContent={setSelectedContent}
              onOpenCreateModal={(date) => {
                setCreateDefaultDate(date);
                setIsCreateModalOpen(true);
              }}
              onMoveDatePrompt={(item, targetDate) => {
                setMoveDateModalContent(item);
                setMoveDateTargetDate(targetDate);
              }}
            />
          )}

          {/* TAB 3: CONTENT REPOSITORY (Admin View of all content) */}
          {currentTab === 'content' && (
            <AdminDashboard
              metrics={metrics}
              contentList={displayedContent}
              allUsers={users}
              issues={issues}
              onSelectContent={setSelectedContent}
              onOpenCreateModal={() => {
                setCreateDefaultDate(undefined);
                setIsCreateModalOpen(true);
              }}
              onNavigateToCalendar={() => setCurrentTab('calendar')}
            />
          )}

          {/* TAB 4: MY WORK (Editor) */}
          {currentTab === 'my_work' && (
            <EditorDashboard
              currentUser={currentUser}
              allContent={displayedContent}
              allUsers={users}
              onSelectContent={setSelectedContent}
            />
          )}

          {/* TAB 5: POSTING QUEUE (Poster) */}
          {currentTab === 'posting_queue' && (
            <PosterDashboard
              currentUser={currentUser}
              allContent={displayedContent}
              allUsers={users}
              onSelectContent={setSelectedContent}
              onOpenPostingModal={(item) => setPostingModalContent(item)}
              onOpenIssueModal={(item) => setIssueModalContent(item)}
            />
          )}

          {/* TAB 6: TEAM MANAGEMENT (Admin) */}
          {currentTab === 'team' && (
            <TeamManagement
              users={users}
              contentList={contentList}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {/* TAB 7: ACTIVITY AUDIT TRAIL */}
          {currentTab === 'activity' && (
            <ActivityLogView
              logs={activityLogs}
              allUsers={users}
            />
          )}

          {/* TAB 8: SETTINGS */}
          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* MODAL 1: Content Detail Workspace Modal */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          isOpen={Boolean(selectedContent)}
          onClose={() => setSelectedContent(null)}
          currentUser={currentUser}
          allUsers={users}
          activityLogs={activityLogs.filter(l => l.content_id === selectedContent.id)}
          issues={issues.filter(i => i.content_id === selectedContent.id)}
          onUploadVideo={handleUploadVideo}
          onMarkPostedClick={() => setPostingModalContent(selectedContent)}
          onRequestRevisionClick={() => setRevisionModalContent(selectedContent)}
          onReportIssueClick={() => setIssueModalContent(selectedContent)}
          onMoveDateClick={() => setMoveDateModalContent(selectedContent)}
          onDuplicateClick={handleDuplicateContent}
          onDeleteClick={handleDeleteContent}
          onResolveIssue={handleResolveIssue}
        />
      )}

      {/* MODAL 2: Create Content Modal */}
      {isCreateModalOpen && (
        <CreateContentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          users={users}
          defaultDate={createDefaultDate}
          onCreate={handleCreateContent}
        />
      )}

      {/* MODAL 3: Posting Confirmation Modal */}
      {postingModalContent && (
        <PostingConfirmModal
          content={postingModalContent}
          isOpen={Boolean(postingModalContent)}
          onClose={() => setPostingModalContent(null)}
          onConfirm={handleConfirmPosting}
        />
      )}

      {/* MODAL 4: Report Issue Modal */}
      {issueModalContent && (
        <ReportIssueModal
          content={issueModalContent}
          isOpen={Boolean(issueModalContent)}
          onClose={() => setIssueModalContent(null)}
          onSubmitIssue={handleSubmitIssue}
        />
      )}

      {/* MODAL 5: Revision Modal */}
      {revisionModalContent && (
        <RevisionModal
          content={revisionModalContent}
          isOpen={Boolean(revisionModalContent)}
          onClose={() => setRevisionModalContent(null)}
          onSubmitRevision={handleRequestRevision}
        />
      )}

      {/* MODAL 6: Move Date Modal */}
      {moveDateModalContent && (
        <MoveDateModal
          content={moveDateModalContent}
          targetDate={moveDateTargetDate}
          isOpen={Boolean(moveDateModalContent)}
          onClose={() => {
            setMoveDateModalContent(null);
            setMoveDateTargetDate(undefined);
          }}
          onConfirmMove={handleMoveDate}
        />
      )}
    </div>
  );
}
