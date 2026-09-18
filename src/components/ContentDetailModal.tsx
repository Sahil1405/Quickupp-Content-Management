import React, { useState, useRef } from 'react';
import { 
  ContentItem, 
  User, 
  ActivityLog, 
  ContentIssue, 
  IssueType 
} from '../types';
import { StatusBadge, OverdueBadge } from './StatusBadge';
import { PlatformBadge, ContentTypeBadge } from './PlatformBadge';
import { UserAvatar } from './UserAvatar';
import { 
  X, 
  Download, 
  UploadCloud, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Calendar, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  CopyCheck, 
  Trash2, 
  Send,
  FileVideo,
  FileText,
  Activity,
  AlertCircle,
  HelpCircle,
  Film,
  Lock,
  Shield
} from 'lucide-react';

interface ContentDetailModalProps {
  content: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  activityLogs: ActivityLog[];
  issues: ContentIssue[];
  onUploadVideo: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onMarkPostedClick: () => void;
  onRequestRevisionClick: () => void;
  onReportIssueClick: () => void;
  onMoveDateClick: () => void;
  onDuplicateClick: () => Promise<void>;
  onDeleteClick: () => Promise<void>;
  onResolveIssue: (issueId: string) => Promise<void>;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  content,
  isOpen,
  onClose,
  currentUser,
  allUsers,
  activityLogs,
  issues,
  onUploadVideo,
  onMarkPostedClick,
  onRequestRevisionClick,
  onReportIssueClick,
  onMoveDateClick,
  onDuplicateClick,
  onDeleteClick,
  onResolveIssue,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'issues'>('details');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const editor = allUsers.find(u => u.id === content.editor_id);
  const poster = allUsers.find(u => u.id === content.poster_id);

  // Check overdue
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const isOverduePosting =
    content.status === 'READY_TO_POST' &&
    (content.scheduled_date < todayStr ||
      (content.scheduled_date === todayStr && content.scheduled_time < nowTime));
  const isOverdueEditing =
    (content.status === 'EDITING' || content.status === 'PLANNED') &&
    (content.scheduled_date < todayStr ||
      (content.scheduled_date === todayStr && content.scheduled_time < nowTime));

  const canUploadOrReplace =
    currentUser.role === 'admin' ||
    (currentUser.role === 'editor' && currentUser.id === content.editor_id);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(content.caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(content.hashtags);
      setHashtagsCopied(true);
      setTimeout(() => setHashtagsCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      await onUploadVideo(file, (percent) => {
        setUploadProgress(percent);
      });
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(null);
      }, 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload video');
      setUploadProgress(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '48.5 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-wrap">
            <PlatformBadge platform={content.platform} />
            <ContentTypeBadge type={content.content_type} />
            <StatusBadge status={content.status} size="md" />
            {isOverduePosting && <OverdueBadge type="posting" />}
            {isOverdueEditing && <OverdueBadge type="editing" />}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-6 text-xs font-semibold shrink-0 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Publishing Workspace
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'activity'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity History</span>
            {activityLogs.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                {activityLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'issues'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Issues</span>
            {issues.filter(i => i.status === 'OPEN').length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                {issues.filter(i => i.status === 'OPEN').length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Title & Schedule */}
              <div>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {content.title}
                  </h2>
                  {currentUser.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Manager Authoring Privileges</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Manager Specs Protected</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Scheduled: {content.scheduled_date}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {content.scheduled_time}
                  </span>
                  {content.description && (
                    <span className="text-slate-500 line-clamp-1 italic">
                      — {content.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Banner for Handoff (Section 47) */}
              {content.status === 'READY_TO_POST' && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        ✓ Video Uploaded — Ready for Publishing
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        Assigned Poster: <span className="font-semibold">{poster?.name || 'Intern'}</span> · Scheduled for {content.scheduled_time} today.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onMarkPostedClick}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors shrink-0"
                    id="btn-mark-posted-banner"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mark as Posted</span>
                  </button>
                </div>
              )}

              {/* Revision Banner if status is REVISION */}
              {content.status === 'REVISION' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                      Revision Requested
                    </div>
                    <p className="text-xs text-orange-800 mt-1">
                      {content.internal_notes || 'Please make requested modifications and re-upload final video.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Posted Confirmation Banner */}
              {content.status === 'POSTED' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Published ✓
                      </div>
                      <div className="text-xs text-blue-700 mt-0.5">
                        Posted by <span className="font-semibold">{allUsers.find(u => u.id === content.posted_by)?.name || 'Admin'}</span> on {content.posted_at ? new Date(content.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'today'}.
                      </div>
                    </div>
                  </div>

                  {content.post_url && (
                    <a
                      href={content.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Live Post</span>
                    </a>
                  )}
                </div>
              )}

              {/* Main 2-Column Section: Left = Video & Upload; Right = Copy & Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Video Preview & Actions (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-800 flex flex-col items-center justify-center relative min-h-[300px]">
                    {content.video_url ? (
                      <video
                        src={content.video_url}
                        controls
                        playsInline
                        className="w-full max-h-[380px] bg-black object-contain"
                      />
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <FileVideo className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                        <p className="text-sm font-medium text-slate-300">No Final Video Uploaded Yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Assigned to {editor?.name || 'Editor'} for editing
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Video Metadata Box */}
                  {content.video_url && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">File:</span>
                        <span className="font-mono text-slate-900 truncate max-w-[200px]">
                          {content.video_filename || 'reel_final.mp4'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Size:</span>
                        <span className="text-slate-900">{formatFileSize(content.video_filesize)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Uploaded by:</span>
                        <span className="text-slate-900">
                          {allUsers.find(u => u.id === content.video_uploaded_by)?.name || editor?.name || 'Editor'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary Video Actions: DOWNLOAD & UPLOAD/REPLACE */}
                  <div className="space-y-2">
                    {content.video_url && (
                      <a
                        href={content.video_url.endsWith('/download') ? content.video_url : `${content.video_url}/download`}
                        download={content.video_filename || 'contentflow_video.mp4'}
                        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all"
                        id="btn-download-video"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD VIDEO</span>
                      </a>
                    )}

                    {canUploadOrReplace && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full inline-flex items-center justify-center gap-2 border font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all ${
                            content.video_url
                              ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                              : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                          }`}
                          id="btn-upload-video"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>{content.video_url ? 'Replace Video' : 'Upload Final Video'}</span>
                        </button>
                      </div>
                    )}

                    {/* Upload progress indicator */}
                    {uploadProgress !== null && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Uploading final video...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Video uploaded successfully ✓ Status moved to Ready to Post!</span>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 text-center">
                        {uploadError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Information, Copyables & Instructions (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Responsibility cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Assigned Video Editor
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <UserAvatar user={editor} size="sm" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {editor?.name || 'Unassigned'}
                          </span>
                          <span className="text-[10px] text-slate-500">Video Producer</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Assigned Posting Intern
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <UserAvatar user={poster} size="sm" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {poster?.name || 'Unassigned'}
                          </span>
                          <span className="text-[10px] text-slate-500">Social Publisher</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Caption Box */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Caption
                      </span>
                      <button
                        onClick={handleCopyCaption}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                          captionCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        id="btn-copy-caption"
                      >
                        {captionCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Caption copied ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Caption</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3.5 text-xs sm:text-sm text-slate-800 font-normal whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
                      {content.caption || 'No caption provided.'}
                    </div>
                  </div>

                  {/* Hashtags Box */}
                  {content.hashtags && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Hashtags
                        </span>
                        <button
                          onClick={handleCopyHashtags}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            hashtagsCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                          id="btn-copy-hashtags"
                        >
                          {hashtagsCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Hashtags copied ✓</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Hashtags</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 text-xs sm:text-sm text-slate-700 font-mono">
                        {content.hashtags}
                      </div>
                    </div>
                  )}

                  {/* Posting Instructions */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Posting Instructions
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {content.instructions || 'Post as vertical Reel. Add specified caption & hashtags. Ensure audio synchronization.'}
                    </p>
                  </div>

                  {/* Workflow Action Bar */}
                  <div className="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onReportIssueClick}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-200"
                        id="btn-report-issue"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Report Issue</span>
                      </button>

                      {currentUser.role === 'admin' && content.status !== 'POSTED' && (
                        <button
                          onClick={onRequestRevisionClick}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-800 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors border border-orange-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request Revision</span>
                        </button>
                      )}
                    </div>

                    {/* Admin management actions */}
                    {currentUser.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onMoveDateClick}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          onClick={onDuplicateClick}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200"
                        >
                          <CopyCheck className="w-3.5 h-3.5" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={onDeleteClick}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Activity History Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Chronological Activity Trail
              </h4>
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No activity recorded for this content item yet.
                </div>
              ) : (
                <div className="relative border-l border-slate-200 ml-3 pl-4 space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {log.description}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reported Problems
                </h4>
                <button
                  onClick={onReportIssueClick}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  + Report New Problem
                </button>
              </div>

              {issues.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  ✓ No issues reported for this video.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                        issue.status === 'OPEN'
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              issue.status === 'OPEN'
                                ? 'bg-rose-200 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {issue.status}
                          </span>
                          <span className="text-xs font-bold text-slate-800 capitalize">
                            {issue.issue_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">{issue.description}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Reported by {issue.reporter_name || 'Team member'} on{' '}
                          {new Date(issue.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {issue.status === 'OPEN' && (
                        <button
                          onClick={() => onResolveIssue(issue.id)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs shrink-0 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
