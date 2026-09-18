import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db } from './server/db';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for uploaded video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    cb(null, `${cleanBase}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.webm', '.m4v', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MOV, WEBM) are supported'));
    }
  },
});

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory active user simulation (defaults to Meher, admin)
  let currentActiveUserId = 'user-admin-1';

  // Helper to get active user
  const getActiveUser = (req: Request) => {
    const headerUserId = req.headers['x-user-id'] as string;
    const targetId = headerUserId || currentActiveUserId;
    return db.getUserById(targetId) || db.getUsers().find(u => u.role === 'admin') || db.getUsers()[0];
  };

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth / Current User
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getActiveUser(req);
    res.json({ user });
  });

  app.post('/api/auth/switch-user', (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    currentActiveUserId = userId;
    res.json({ success: true, user });
  });

  // Users
  app.get('/api/users', (req: Request, res: Response) => {
    res.json({ users: db.getUsers() });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create team members' });
    }
    const { name, email, role, avatar } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }
    const newUser = db.createUser({
      name,
      email,
      role,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      status: 'active',
    });
    res.status(201).json({ user: newUser });
  });

  app.patch('/api/users/:id', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can modify team members' });
    }
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: updated });
  });

  // Operational Metrics
  app.get('/api/metrics', (req: Request, res: Response) => {
    const metrics = db.getOperationalMetrics();
    res.json(metrics);
  });

  // Content Endpoints
  app.get('/api/content', (req: Request, res: Response) => {
    const { status, editor_id, poster_id, platform, date, search } = req.query;
    const items = db.getContentList({
      status: status as string,
      editor_id: editor_id as string,
      poster_id: poster_id as string,
      platform: platform as string,
      date: date as string,
      search: search as string,
    });
    res.json({ content: items });
  });

  app.get('/api/content/:id', (req: Request, res: Response) => {
    const item = db.getContentById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }
    const logs = db.getActivityLogs(item.id);
    const issues = db.getIssues(item.id);
    res.json({ content: item, activity_logs: logs, issues });
  });

  app.post('/api/content', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create new content' });
    }

    const {
      title,
      description,
      content_type,
      platform,
      scheduled_date,
      scheduled_time,
      editor_id,
      poster_id,
      caption,
      hashtags,
      instructions,
      reference_notes,
      internal_notes,
      tags,
    } = req.body;

    if (!title || !scheduled_date || !scheduled_time || !editor_id || !poster_id) {
      return res.status(400).json({
        error: 'Title, scheduled date, scheduled time, editor, and poster are required',
      });
    }

    const newItem = db.createContent(
      {
        title,
        description: description || '',
        content_type: content_type || 'reel',
        platform: platform || 'instagram',
        scheduled_date,
        scheduled_time,
        editor_id,
        poster_id,
        caption: caption || '',
        hashtags: hashtags || '',
        instructions: instructions || 'Publish to primary feed with supplied cover and caption.',
        reference_notes,
        internal_notes,
        tags: tags || [],
        status: 'PLANNED',
        created_by: currentUser.id,
      },
      currentUser
    );

    res.status(201).json({ content: newItem });
  });

  app.patch('/api/content/:id', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    const existing = db.getContentById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Role-based security enforcement
    if (currentUser.role === 'editor') {
      const forbiddenEditorFields = [
        'title', 'description', 'content_type', 'platform',
        'scheduled_date', 'scheduled_time', 'editor_id', 'poster_id',
        'instructions', 'caption', 'hashtags'
      ];
      const attempted = Object.keys(req.body);
      const violations = attempted.filter(f => forbiddenEditorFields.includes(f));
      if (violations.length > 0) {
        return res.status(403).json({
          error: `Access Denied: Editors are not permitted to alter manager-defined parameters (${violations.join(', ')}). Tasks are strictly managed by Admins.`,
        });
      }
    } else if (currentUser.role === 'poster') {
      const forbiddenPosterFields = [
        'title', 'description', 'content_type', 'platform',
        'scheduled_date', 'scheduled_time', 'editor_id', 'poster_id',
        'instructions', 'caption', 'hashtags', 'video_url', 'video_filename'
      ];
      const attempted = Object.keys(req.body);
      const violations = attempted.filter(f => forbiddenPosterFields.includes(f));
      if (violations.length > 0) {
        return res.status(403).json({
          error: `Access Denied: Posting interns are not permitted to alter manager-defined parameters (${violations.join(', ')}).`,
        });
      }
    }

    const updated = db.updateContent(req.params.id, req.body, currentUser);
    if (!updated) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ content: updated });
  });

  // Video Upload Endpoint for Editors & Admins
  app.post('/api/content/:id/upload-video', upload.single('video'), (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role === 'poster') {
      return res.status(403).json({ error: 'Posting interns cannot upload or replace final videos' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoUrl = `/api/videos/${file.filename}`;
    const updated = db.uploadVideoForContent(
      req.params.id,
      {
        video_url: videoUrl,
        video_filename: file.originalname,
        video_filesize: file.size,
      },
      currentUser
    );

    if (!updated) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      success: true,
      content: updated,
      file: {
        url: videoUrl,
        filename: file.originalname,
        size: file.size,
      },
    });
  });

  // Poster: Mark as Posted
  app.post('/api/content/:id/mark-posted', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    const { post_url, posted_at, posting_notes, platform } = req.body;

    const updated = db.markContentAsPosted(
      req.params.id,
      {
        post_url,
        posted_at,
        posting_notes,
        platform,
      },
      currentUser
    );

    if (!updated) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ success: true, content: updated });
  });

  // Revision Request (Admin)
  app.post('/api/content/:id/revision', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can request revisions' });
    }
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'Revision notes are required' });
    }

    const updated = db.requestRevision(req.params.id, notes, currentUser);
    if (!updated) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ success: true, content: updated });
  });

  // Report Issue (Poster, Editor, Admin)
  app.post('/api/content/:id/report-issue', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    const { issue_type, description } = req.body;
    if (!issue_type || !description) {
      return res.status(400).json({ error: 'Issue type and description are required' });
    }

    const issue = db.reportIssue(
      {
        content_id: req.params.id,
        issue_type,
        description,
      },
      currentUser
    );

    res.status(201).json({ success: true, issue });
  });

  // Duplicate Content (Admin)
  app.post('/api/content/:id/duplicate', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can duplicate content' });
    }

    const duplicate = db.duplicateContent(req.params.id, currentUser);
    if (!duplicate) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.status(201).json({ success: true, content: duplicate });
  });

  // Delete Content (Admin)
  app.delete('/api/content/:id', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete content' });
    }

    const success = db.deleteContent(req.params.id, currentUser);
    if (!success) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ success: true });
  });

  // Issues
  app.get('/api/issues', (req: Request, res: Response) => {
    const { content_id } = req.query;
    res.json({ issues: db.getIssues(content_id as string) });
  });

  app.patch('/api/issues/:id/resolve', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    const resolved = db.resolveIssue(req.params.id, currentUser);
    if (!resolved) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json({ success: true, issue: resolved });
  });

  // Activity Logs
  app.get('/api/activity', (req: Request, res: Response) => {
    const { content_id, limit } = req.query;
    res.json({
      activity_logs: db.getActivityLogs(
        content_id as string,
        limit ? parseInt(limit as string) : 50
      ),
    });
  });

  // Notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    res.json({ notifications: db.getNotifications(currentUser.id) });
  });

  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    const success = db.markNotificationAsRead(req.params.id);
    res.json({ success });
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    db.markAllNotificationsAsRead(currentUser.id);
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ settings: db.getSettings() });
  });

  app.patch('/api/settings', (req: Request, res: Response) => {
    const currentUser = getActiveUser(req);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update workspace settings' });
    }
    const updated = db.updateSettings(req.body);
    res.json({ settings: updated });
  });

  // --- Video Streaming & Direct Download Endpoints ---

  // Direct video download (Content-Disposition: attachment)
  app.get('/api/videos/:filename/download', (req: Request, res: Response) => {
    const { filename } = req.params;
    const sanitized = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, sanitized);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const currentUser = getActiveUser(req);
    // Log download activity if related content exists
    const allContent = db.getContentList();
    const content = allContent.find(c => c.video_url?.includes(sanitized));
    if (content) {
      db.logActivity({
        content_id: content.id,
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: 'downloaded_video',
        description: `${currentUser.name} downloaded video ${content.video_filename || sanitized}.`,
      });
    }

    const downloadName = content?.video_filename || sanitized;
    res.download(filePath, downloadName, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Failed to download video file' });
      }
    });
  });

  // Video Streaming with HTTP Range support for video players
  app.get('/api/videos/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const sanitized = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, sanitized);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Video not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mimeType = sanitized.endsWith('.webm')
      ? 'video/webm'
      : sanitized.endsWith('.mov')
      ? 'video/quicktime'
      : 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Vite middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ContentFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start ContentFlow server:', err);
});
