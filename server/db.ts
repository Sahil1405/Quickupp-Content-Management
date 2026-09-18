import fs from 'fs';
import path from 'path';
import { 
  User, 
  ContentItem, 
  ActivityLog, 
  ContentIssue, 
  AppNotification, 
  WorkspaceSettings,
  OperationalMetrics 
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'contentflow.db.json');

export interface DatabaseSchema {
  users: User[];
  content: ContentItem[];
  activity_logs: ActivityLog[];
  issues: ContentIssue[];
  notifications: AppNotification[];
  settings: WorkspaceSettings;
}

// Initial seed data
const initialUsers: User[] = [
  {
    id: 'user-admin-1',
    name: 'Meher',
    email: 'meherpashasayyed@gmail.com',
    avatar: '',
    role: 'admin',
    status: 'active',
    created_at: '2026-09-18T00:00:00Z',
    updated_at: '2026-09-18T00:00:00Z',
  },
];

const initialSettings: WorkspaceSettings = {
  workspace_name: 'ContentFlow',
  default_timezone: 'Asia/Kolkata',
  default_platform: 'instagram',
  allow_editor_replace: true,
  notification_email: true,
};

const initialContent: ContentItem[] = [];
const initialActivityLogs: ActivityLog[] = [];
const initialIssues: ContentIssue[] = [];
const initialNotifications: AppNotification[] = [];

class RelationalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, re-initializing seed data', err);
      }
    }

    const defaultData: DatabaseSchema = {
      users: initialUsers,
      content: initialContent,
      activity_logs: initialActivityLogs,
      issues: initialIssues,
      notifications: initialNotifications,
      settings: initialSettings,
    };

    this.persist(defaultData);
    return defaultData;
  }

  private persist(dataToPersist?: DatabaseSchema) {
    try {
      const data = dataToPersist || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file', err);
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.data.users[idx];
  }

  // Content
  getContentList(filters?: {
    status?: string;
    editor_id?: string;
    poster_id?: string;
    platform?: string;
    date?: string;
    search?: string;
  }): ContentItem[] {
    let items = [...this.data.content];

    if (filters) {
      if (filters.status) {
        items = items.filter(c => c.status === filters.status);
      }
      if (filters.editor_id) {
        items = items.filter(c => c.editor_id === filters.editor_id);
      }
      if (filters.poster_id) {
        items = items.filter(c => c.poster_id === filters.poster_id);
      }
      if (filters.platform) {
        items = items.filter(c => c.platform === filters.platform);
      }
      if (filters.date) {
        items = items.filter(c => c.scheduled_date === filters.date);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const users = this.data.users;
        items = items.filter(c => {
          const editor = users.find(u => u.id === c.editor_id)?.name.toLowerCase() || '';
          const poster = users.find(u => u.id === c.poster_id)?.name.toLowerCase() || '';
          return (
            c.title.toLowerCase().includes(q) ||
            c.caption.toLowerCase().includes(q) ||
            c.hashtags.toLowerCase().includes(q) ||
            editor.includes(q) ||
            poster.includes(q) ||
            c.platform.toLowerCase().includes(q)
          );
        });
      }
    }

    // Sort by scheduled_date ascending, then scheduled_time
    return items.sort((a, b) => {
      const dateCmp = a.scheduled_date.localeCompare(b.scheduled_date);
      if (dateCmp !== 0) return dateCmp;
      return a.scheduled_time.localeCompare(b.scheduled_time);
    });
  }

  getContentById(id: string): ContentItem | undefined {
    return this.data.content.find(c => c.id === id);
  }

  createContent(
    item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>,
    creator: User
  ): ContentItem {
    const newContent: ContentItem = {
      ...item,
      id: `content-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.content.push(newContent);

    // Record activity log
    this.logActivity({
      content_id: newContent.id,
      user_id: creator.id,
      user_name: creator.name,
      user_role: creator.role,
      action: 'created_content',
      description: `${creator.name} created content "${newContent.title}".`,
    });

    // Notify all team members when new content is created
    this.notifyAllUsers({
      title: `📋 New Task Created: "${newContent.title}"`,
      message: `${creator.name} created "${newContent.title}" for ${newContent.platform} (${newContent.scheduled_date} at ${newContent.scheduled_time}).`,
      content_id: newContent.id,
      type: 'assigned',
    });

    this.persist();
    return newContent;
  }

  updateContent(
    id: string,
    updates: Partial<ContentItem>,
    modifier: User
  ): ContentItem | null {
    const idx = this.data.content.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const oldItem = this.data.content[idx];
    const updatedItem: ContentItem = {
      ...oldItem,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Notify new editor if reassigned
    if (updates.editor_id && updates.editor_id !== oldItem.editor_id) {
      this.createNotification({
        user_id: updates.editor_id,
        title: 'Editing task reassigned to you',
        message: `${modifier.name} assigned you to edit "${updatedItem.title}" due ${updatedItem.scheduled_date}.`,
        content_id: id,
        type: 'assigned',
      });
    }

    // Notify new poster if reassigned
    if (updates.poster_id && updates.poster_id !== oldItem.poster_id) {
      this.createNotification({
        user_id: updates.poster_id,
        title: 'Publishing task reassigned to you',
        message: `${modifier.name} assigned you to publish "${updatedItem.title}" to ${updatedItem.platform}.`,
        content_id: id,
        type: 'assigned',
      });
    }

    // Track date changes
    if (updates.scheduled_date && updates.scheduled_date !== oldItem.scheduled_date) {
      this.logActivity({
        content_id: id,
        user_id: modifier.id,
        user_name: modifier.name,
        user_role: modifier.role,
        action: 'date_changed',
        description: `${modifier.name} moved scheduled date from ${oldItem.scheduled_date} to ${updates.scheduled_date}.`,
      });
      this.notifyAllUsers({
        title: `📅 Task Rescheduled: "${updatedItem.title}"`,
        message: `${modifier.name} moved date from ${oldItem.scheduled_date} to ${updates.scheduled_date}.`,
        content_id: id,
        type: 'general',
      });
    }

    // Track status change
    if (updates.status && updates.status !== oldItem.status) {
      this.logActivity({
        content_id: id,
        user_id: modifier.id,
        user_name: modifier.name,
        user_role: modifier.role,
        action: 'status_changed',
        description: `Status changed: ${oldItem.status} → ${updates.status}.`,
      });
      this.notifyAllUsers({
        title: `🔄 Status Changed: "${updatedItem.title}"`,
        message: `Status updated to ${updates.status} by ${modifier.name}.`,
        content_id: id,
        type: 'general',
      });
    }

    this.data.content[idx] = updatedItem;
    this.persist();
    return updatedItem;
  }

  duplicateContent(id: string, user: User): ContentItem | null {
    const source = this.getContentById(id);
    if (!source) return null;

    const duplicate: ContentItem = {
      ...source,
      id: `content-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${source.title} (Copy)`,
      status: 'PLANNED',
      post_url: undefined,
      posted_at: undefined,
      posted_by: undefined,
      video_url: undefined,
      video_filename: undefined,
      video_filesize: undefined,
      video_uploaded_at: undefined,
      video_uploaded_by: undefined,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.content.push(duplicate);

    this.logActivity({
      content_id: duplicate.id,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'duplicated_content',
      description: `${user.name} duplicated "${source.title}".`,
    });

    this.persist();
    return duplicate;
  }

  deleteContent(id: string, user: User): boolean {
    const idx = this.data.content.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const title = this.data.content[idx].title;
    this.data.content.splice(idx, 1);

    this.logActivity({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'deleted_content',
      description: `${user.name} deleted content "${title}".`,
    });

    this.persist();
    return true;
  }

  // Upload video transition
  uploadVideoForContent(
    contentId: string,
    videoData: {
      video_url: string;
      video_filename: string;
      video_filesize: number;
    },
    uploader: User
  ): ContentItem | null {
    const item = this.getContentById(contentId);
    if (!item) return null;

    const updatedItem = this.updateContent(
      contentId,
      {
        video_url: videoData.video_url,
        video_filename: videoData.video_filename,
        video_filesize: videoData.video_filesize,
        video_uploaded_at: new Date().toISOString(),
        video_uploaded_by: uploader.id,
        status: 'READY_TO_POST',
      },
      uploader
    );

    if (updatedItem) {
      this.logActivity({
        content_id: contentId,
        user_id: uploader.id,
        user_name: uploader.name,
        user_role: uploader.role,
        action: 'uploaded_final_video',
        description: `${uploader.name} uploaded final video ${videoData.video_filename}.`,
        metadata: videoData,
      });

      // Notify all users: Task completed / ready to post
      this.notifyAllUsers({
        title: `🎬 Task Completed: "${item.title}"`,
        message: `${uploader.name} finished and uploaded final video for "${item.title}". Ready to publish on ${item.platform}!`,
        content_id: item.id,
        type: 'ready_to_post',
      });
    }

    return updatedItem;
  }

  // Mark as Posted transition
  markContentAsPosted(
    contentId: string,
    postingData: {
      post_url?: string;
      posted_at?: string;
      posting_notes?: string;
      platform?: string;
    },
    poster: User
  ): ContentItem | null {
    const item = this.getContentById(contentId);
    if (!item) return null;

    const now = new Date().toISOString();
    const updated = this.updateContent(
      contentId,
      {
        status: 'POSTED',
        posted_by: poster.id,
        posted_at: postingData.posted_at || now,
        post_url: postingData.post_url,
        posting_notes: postingData.posting_notes,
      },
      poster
    );

    if (updated) {
      this.logActivity({
        content_id: contentId,
        user_id: poster.id,
        user_name: poster.name,
        user_role: poster.role,
        action: 'marked_posted',
        description: `${poster.name} marked content as Posted.`,
      });

      if (postingData.post_url) {
        this.logActivity({
          content_id: contentId,
          user_id: poster.id,
          user_name: poster.name,
          user_role: poster.role,
          action: 'added_post_url',
          description: `Post URL added: ${postingData.post_url}`,
        });
      }

      // Notify all users: Task published
      this.notifyAllUsers({
        title: `🚀 Task Published: "${item.title}"`,
        message: `${poster.name} successfully published "${item.title}" to ${item.platform}! Post is now live.`,
        content_id: item.id,
        type: 'posted',
      });
    }

    return updated;
  }

  // Revision request
  requestRevision(
    contentId: string,
    notes: string,
    requester: User
  ): ContentItem | null {
    const item = this.getContentById(contentId);
    if (!item) return null;

    const updated = this.updateContent(
      contentId,
      {
        status: 'REVISION',
        internal_notes: notes,
      },
      requester
    );

    if (updated) {
      this.logActivity({
        content_id: contentId,
        user_id: requester.id,
        user_name: requester.name,
        user_role: requester.role,
        action: 'revision_requested',
        description: `${requester.name} requested revision: ${notes}`,
      });

      // Notify all users: Task reviewed & flagged for revision
      this.notifyAllUsers({
        title: `🔁 Task Flagged for Revision: "${item.title}"`,
        message: `${requester.name} reviewed and flagged "${item.title}": "${notes}".`,
        content_id: item.id,
        type: 'revision',
      });
    }

    return updated;
  }

  // Issues
  reportIssue(
    issueData: {
      content_id: string;
      issue_type: any;
      description: string;
    },
    reporter: User
  ): ContentIssue {
    const content = this.getContentById(issueData.content_id);
    const newIssue: ContentIssue = {
      id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content_id: issueData.content_id,
      content_title: content?.title || 'Unknown Content',
      reported_by: reporter.id,
      reporter_name: reporter.name,
      issue_type: issueData.issue_type,
      description: issueData.description,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };

    this.data.issues.push(newIssue);

    // Update content status to ISSUE
    if (content) {
      this.updateContent(issueData.content_id, { status: 'ISSUE' }, reporter);
    }

    this.logActivity({
      content_id: issueData.content_id,
      user_id: reporter.id,
      user_name: reporter.name,
      user_role: reporter.role,
      action: 'reported_issue',
      description: `${reporter.name} reported an issue: ${issueData.description}`,
    });

    // Notify all users: Review flag / Issue reported
    this.notifyAllUsers({
      title: `⚠️ Review Flag / Issue: "${content?.title || 'Task'}"`,
      message: `${reporter.name} flagged an issue [${issueData.issue_type}] on "${content?.title || 'Task'}": "${issueData.description}".`,
      content_id: issueData.content_id,
      type: 'issue',
    });

    this.persist();
    return newIssue;
  }

  resolveIssue(issueId: string, resolver: User): ContentIssue | null {
    const issue = this.data.issues.find(i => i.id === issueId);
    if (!issue) return null;

    issue.status = 'RESOLVED';
    issue.resolved_by = resolver.id;
    issue.resolved_at = new Date().toISOString();

    const content = this.getContentById(issue.content_id);
    if (content && content.status === 'ISSUE') {
      const nextStatus = content.video_url ? 'READY_TO_POST' : 'EDITING';
      this.updateContent(content.id, { status: nextStatus }, resolver);
    }

    this.logActivity({
      content_id: issue.content_id,
      user_id: resolver.id,
      user_name: resolver.name,
      user_role: resolver.role,
      action: 'resolved_issue',
      description: `${resolver.name} resolved issue #${issue.id}.`,
    });

    // Notify all users: Issue resolved
    this.notifyAllUsers({
      title: `✨ Issue Resolved: "${issue.content_title || 'Task'}"`,
      message: `${resolver.name} marked the flagged issue on "${issue.content_title || 'Task'}" as resolved.`,
      content_id: issue.content_id,
      type: 'general',
    });

    this.persist();
    return issue;
  }

  getIssues(contentId?: string): ContentIssue[] {
    if (contentId) {
      return this.data.issues.filter(i => i.content_id === contentId);
    }
    return this.data.issues.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // Activity Logs
  logActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    this.data.activity_logs.unshift(newLog); // newest first
    this.persist();
    return newLog;
  }

  getActivityLogs(contentId?: string, limit = 50): ActivityLog[] {
    let logs = this.data.activity_logs;
    if (contentId) {
      logs = logs.filter(l => l.content_id === contentId);
    }
    return logs.slice(0, limit);
  }

  // Notifications
  createNotification(notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  notifyAllUsers(notif: {
    title: string;
    message: string;
    content_id?: string;
    type?: AppNotification['type'];
  }): void {
    const users = this.data.users;
    for (const u of users) {
      this.createNotification({
        user_id: u.id,
        title: notif.title,
        message: notif.message,
        content_id: notif.content_id,
        type: notif.type || 'general',
      });
    }
  }

  getNotifications(userId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.persist();
    return true;
  }

  markAllNotificationsAsRead(userId: string): void {
    for (const notif of this.data.notifications) {
      if (notif.user_id === userId) {
        notif.read = true;
      }
    }
    this.persist();
  }

  // Settings
  getSettings(): WorkspaceSettings {
    return this.data.settings;
  }

  updateSettings(settings: Partial<WorkspaceSettings>): WorkspaceSettings {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
    };
    this.persist();
    return this.data.settings;
  }

  // Metrics computation
  getOperationalMetrics(
    referenceDate = new Date().toISOString().split('T')[0],
    referenceTime = new Date().toTimeString().slice(0, 5)
  ): OperationalMetrics {
    const content = this.data.content;
    let planned = 0;
    let editing = 0;
    let ready_to_post = 0;
    let posted = 0;
    let revision = 0;
    let issue = 0;
    let overdue_editing = 0;
    let overdue_posting = 0;
    let today_count = 0;

    for (const item of content) {
      if (item.status === 'PLANNED') planned++;
      else if (item.status === 'EDITING') editing++;
      else if (item.status === 'READY_TO_POST') ready_to_post++;
      else if (item.status === 'POSTED') posted++;
      else if (item.status === 'REVISION') revision++;
      else if (item.status === 'ISSUE') issue++;

      if (item.scheduled_date === referenceDate) {
        today_count++;
      }

      // Check overdue
      if (item.status !== 'POSTED') {
        const isPastDate = item.scheduled_date < referenceDate;
        const isTodayPastTime = item.scheduled_date === referenceDate && item.scheduled_time < referenceTime;

        if (isPastDate || isTodayPastTime) {
          if (item.status === 'EDITING' || item.status === 'PLANNED') {
            overdue_editing++;
          } else if (item.status === 'READY_TO_POST') {
            overdue_posting++;
          }
        }
      }
    }

    return {
      total: content.length,
      planned,
      editing,
      ready_to_post,
      posted,
      revision,
      issue,
      overdue_editing,
      overdue_posting,
      today_count,
    };
  }
}

export const db = new RelationalDatabase();
