import { 
  User, 
  ContentItem, 
  ActivityLog, 
  ContentIssue, 
  AppNotification, 
  OperationalMetrics, 
  WorkspaceSettings,
  ContentStatus 
} from '../types';

let currentUserId = 'user-admin-1';

export function setActiveUserLocal(userId: string) {
  currentUserId = userId;
  localStorage.setItem('contentflow_user_id', userId);
}

export function getActiveUserLocal(): string {
  return localStorage.getItem('contentflow_user_id') || currentUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('x-user-id', getActiveUserLocal());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // fallback to statusText
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth / Users
  getMe: () => request<{ user: User }>('/api/auth/me'),
  switchUser: (userId: string) => {
    setActiveUserLocal(userId);
    return request<{ success: boolean; user: User }>('/api/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
  getUsers: () => request<{ users: User[] }>('/api/users'),
  createUser: (userData: Partial<User>) => 
    request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (id: string, updates: Partial<User>) =>
    request<{ user: User }>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Metrics
  getMetrics: () => request<OperationalMetrics>('/api/metrics'),

  // Content
  getContent: (filters?: {
    status?: string;
    editor_id?: string;
    poster_id?: string;
    platform?: string;
    date?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ content: ContentItem[] }>(`/api/content${query}`);
  },

  getContentById: (id: string) =>
    request<{
      content: ContentItem;
      activity_logs: ActivityLog[];
      issues: ContentIssue[];
    }>(`/api/content/${id}`),

  createContent: (data: Partial<ContentItem>) =>
    request<{ content: ContentItem }>('/api/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContent: (id: string, data: Partial<ContentItem>) =>
    request<{ content: ContentItem }>(`/api/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadVideo: async (
    contentId: string, 
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<{ content: ContentItem }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('video', file);

      xhr.open('POST', `/api/content/${contentId}/upload-video`, true);
      xhr.setRequestHeader('x-user-id', getActiveUserLocal());

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  },

  markPosted: (contentId: string, data: {
    post_url?: string;
    posted_at?: string;
    posting_notes?: string;
    platform?: string;
  }) =>
    request<{ success: boolean; content: ContentItem }>(`/api/content/${contentId}/mark-posted`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  requestRevision: (contentId: string, notes: string) =>
    request<{ success: boolean; content: ContentItem }>(`/api/content/${contentId}/revision`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  reportIssue: (contentId: string, data: { issue_type: string; description: string }) =>
    request<{ success: boolean; issue: ContentIssue }>(`/api/content/${contentId}/report-issue`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  duplicateContent: (contentId: string) =>
    request<{ success: boolean; content: ContentItem }>(`/api/content/${contentId}/duplicate`, {
      method: 'POST',
    }),

  deleteContent: (contentId: string) =>
    request<{ success: boolean }>(`/api/content/${contentId}`, {
      method: 'DELETE',
    }),

  // Issues
  getIssues: (contentId?: string) => {
    const query = contentId ? `?content_id=${contentId}` : '';
    return request<{ issues: ContentIssue[] }>(`/api/issues${query}`);
  },
  resolveIssue: (issueId: string) =>
    request<{ success: boolean; issue: ContentIssue }>(`/api/issues/${issueId}/resolve`, {
      method: 'PATCH',
    }),

  // Activity
  getActivity: (contentId?: string) => {
    const query = contentId ? `?content_id=${contentId}` : '';
    return request<{ activity_logs: ActivityLog[] }>(`/api/activity${query}`);
  },

  // Notifications
  getNotifications: () =>
    request<{ notifications: AppNotification[] }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  // Settings
  getSettings: () => request<{ settings: WorkspaceSettings }>('/api/settings'),
  updateSettings: (settings: Partial<WorkspaceSettings>) =>
    request<{ settings: WorkspaceSettings }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
};
