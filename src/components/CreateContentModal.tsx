import React, { useState } from 'react';
import { User, ContentType, Platform, ContentItem } from '../types';
import { X, Plus, Film, Calendar, Clock, UserCheck, FileText, Hash, Check } from 'lucide-react';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  defaultDate?: string;
  onCreate: (data: Partial<ContentItem>) => Promise<void>;
}

export const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  users,
  defaultDate,
  onCreate,
}) => {
  const availableEditors = users.filter(u => u.role === 'editor' && u.status === 'active');
  const editors = availableEditors.length > 0 ? availableEditors : users.filter(u => u.status === 'active');

  const availablePosters = users.filter(u => u.role === 'poster' && u.status === 'active');
  const posters = availablePosters.length > 0 ? availablePosters : users.filter(u => u.status === 'active');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('reel');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [scheduledDate, setScheduledDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [editorId, setEditorId] = useState(editors[0]?.id || users[0]?.id || '');
  const [posterId, setPosterId] = useState(posters[0]?.id || users[0]?.id || '');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [instructions, setInstructions] = useState('Post as Instagram Reel. Use cover frame with bold title. Add specified caption.');
  const [referenceNotes, setReferenceNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledDate || !scheduledTime || !editorId || !posterId) {
      setError('Please fill out all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        content_type: contentType,
        platform,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        editor_id: editorId,
        poster_id: posterId,
        caption: caption.trim(),
        hashtags: hashtags.trim(),
        instructions: instructions.trim(),
        reference_notes: referenceNotes.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Create New Content</h3>
              <p className="text-xs text-slate-500">Plan video reel for editing and publishing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
              1. Basic Information
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Content Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 AI Tools Every Founder Needs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Core topic, hook angle, and goals for this video..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as Platform)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube_shorts">YouTube Shorts</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X (Twitter)</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                  >
                    <option value="reel">Reel (Vertical 9:16)</option>
                    <option value="short">Short Video</option>
                    <option value="carousel">Carousel</option>
                    <option value="static">Static Post</option>
                    <option value="story">Story</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Assignment */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
              2. Responsibility &amp; Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Video Editor <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editorId}
                  onChange={(e) => setEditorId(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                >
                  {editors.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.name} ({ed.role.charAt(0).toUpperCase() + ed.role.slice(1)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Posting Intern <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={posterId}
                  onChange={(e) => setPosterId(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                >
                  {posters.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role.charAt(0).toUpperCase() + p.role.slice(1)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Publishing Information */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
              3. Caption &amp; Publishing Assets
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Social Media Caption
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste the final social media caption to be copied by the posting intern..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hashtags
                </label>
                <input
                  type="text"
                  placeholder="#founder #reels #ai #startups #productivity"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Posting Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Post as Instagram Reel. Use cover frame with bold title. Add specified caption."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Optional Notes */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              4. Optional Editor Notes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Editing Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raw footage in Google Drive folder 'Sep 18'"
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Manager Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Part of Q3 sponsor test"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
              id="btn-submit-create-content"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Content...' : 'Create Content'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
