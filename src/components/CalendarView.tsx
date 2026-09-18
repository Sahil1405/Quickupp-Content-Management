import React, { useState } from 'react';
import { 
  ContentItem, 
  User, 
  ContentStatus, 
  Platform 
} from '../types';
import { StatusBadge, OverdueBadge } from './StatusBadge';
import { PlatformBadge } from './PlatformBadge';
import { UserAvatar } from './UserAvatar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Clock, 
  Calendar as CalendarIcon,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Send,
  Move
} from 'lucide-react';

interface CalendarViewProps {
  contentList: ContentItem[];
  allUsers: User[];
  currentUser: User;
  onSelectContent: (content: ContentItem) => void;
  onOpenCreateModal: (date?: string) => void;
  onMoveDatePrompt: (content: ContentItem, targetDate?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  contentList,
  allUsers,
  currentUser,
  onSelectContent,
  onOpenCreateModal,
  onMoveDatePrompt,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  const [year, setYear] = useState(todayObj.getFullYear());
  const [month, setMonth] = useState(todayObj.getMonth());
  const [selectedDay, setSelectedDay] = useState(todayStr);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [editorFilter, setEditorFilter] = useState<string>('ALL');
  const [posterFilter, setPosterFilter] = useState<string>('ALL');

  // Drag-and-drop state for date rescheduling
  const [draggingContentId, setDraggingContentId] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    const cur = new Date();
    setYear(cur.getFullYear());
    setMonth(cur.getMonth());
    setSelectedDay(cur.toISOString().split('T')[0]);
  };

  // Filter content
  const filteredContent = contentList.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (platformFilter !== 'ALL' && item.platform !== platformFilter) return false;
    if (editorFilter !== 'ALL' && item.editor_id !== editorFilter) return false;
    if (posterFilter !== 'ALL' && item.poster_id !== posterFilter) return false;
    return true;
  });

  // Calculate days for Month view
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Adjust so week starts on Monday
  const startOffset = (firstDayOfWeek + 6) % 7;

  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Prev month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month padding to reach a multiple of 7
  const remaining = 35 - calendarCells.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }
  }

  const getContentForDate = (dateStr: string) => {
    return filteredContent.filter(c => c.scheduled_date === dateStr);
  };

  const handleDragStart = (contentId: string) => {
    if (currentUser.role !== 'admin') return;
    setDraggingContentId(contentId);
  };

  const handleDropOnDate = (targetDate: string) => {
    if (!draggingContentId || currentUser.role !== 'admin') return;
    const item = contentList.find(c => c.id === draggingContentId);
    if (item && item.scheduled_date !== targetDate) {
      onMoveDatePrompt(item, targetDate);
    }
    setDraggingContentId(null);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header & View Switchers */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-slate-700" />
            <span>
              {monthNames[month]} {year}
            </span>
          </h2>

          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-white rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode toggle: Month | Week | Day */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Day
            </button>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onOpenCreateModal()}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Plan Content</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar (Section 23) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="EDITING">Editing</option>
          <option value="READY_TO_POST">Ready to Post</option>
          <option value="POSTED">Posted</option>
          <option value="REVISION">Revision</option>
          <option value="ISSUE">Issue</option>
        </select>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube_shorts">YouTube Shorts</option>
          <option value="linkedin">LinkedIn</option>
          <option value="x">X (Twitter)</option>
        </select>

        {/* Editor filter */}
        <select
          value={editorFilter}
          onChange={(e) => setEditorFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">All Editors</option>
          {allUsers.filter(u => u.role === 'editor').map(u => (
            <option key={u.id} value={u.id}>{u.name} (Editor)</option>
          ))}
        </select>

        {/* Poster filter */}
        <select
          value={posterFilter}
          onChange={(e) => setPosterFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">All Posters</option>
          {allUsers.filter(u => u.role === 'poster').map(u => (
            <option key={u.id} value={u.id}>{u.name} (Poster)</option>
          ))}
        </select>

        {(statusFilter !== 'ALL' || platformFilter !== 'ALL' || editorFilter !== 'ALL' || posterFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPlatformFilter('ALL');
              setEditorFilter('ALL');
              setPosterFilter('ALL');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline ml-auto shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[600px]">
            {calendarCells.map((cell) => {
              const dayContent = getContentForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={cell.dateStr}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={() => handleDropOnDate(cell.dateStr)}
                  className={`min-h-[110px] p-2 flex flex-col transition-colors group relative ${
                    !cell.isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white'
                  } ${isToday ? 'bg-blue-50/20 ring-1 ring-blue-400/50 inset-0' : ''}`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => onOpenCreateModal(cell.dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-all"
                        title={`Plan video for ${cell.dateStr}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Content Cards (Section 9) */}
                  <div className="space-y-1.5 flex-1">
                    {dayContent.map((item) => {
                      const editor = allUsers.find(u => u.id === item.editor_id);
                      const poster = allUsers.find(u => u.id === item.poster_id);

                      // Status dot color
                      const statusDotColor = {
                        PLANNED: 'bg-slate-400',
                        EDITING: 'bg-amber-500',
                        READY_TO_POST: 'bg-emerald-500',
                        POSTED: 'bg-blue-500',
                        REVISION: 'bg-orange-500',
                        ISSUE: 'bg-rose-500',
                      }[item.status];

                      return (
                        <div
                          key={item.id}
                          draggable={currentUser.role === 'admin'}
                          onDragStart={() => handleDragStart(item.id)}
                          onClick={() => onSelectContent(item)}
                          className="p-2 rounded-xl border border-slate-200/90 bg-white hover:border-slate-400 hover:shadow-xs cursor-pointer transition-all text-left group/card"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {item.scheduled_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
                              <span className="text-[9px] font-bold uppercase tracking-tight text-slate-600">
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-900 line-clamp-1 leading-snug">
                            {item.title}
                          </div>

                          {/* Editor & Poster attribution */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1 border-t border-slate-100">
                            <span className="truncate">
                              E: <strong className="text-slate-700">{editor?.name || 'Unassigned'}</strong>
                            </span>
                            <span className="truncate">
                              P: <strong className="text-slate-700">{poster?.name || 'Unassigned'}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Current Week Schedule
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {(() => {
              const base = new Date(selectedDay + 'T00:00:00');
              const day = base.getDay();
              const diff = day === 0 ? -6 : 1 - day;
              const monday = new Date(base);
              monday.setDate(base.getDate() + diff);
              const weekDays: string[] = [];
              for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                weekDays.push(d.toISOString().split('T')[0]);
              }
              return weekDays;
            })().map((d) => {
              const dayItems = getContentForDate(d);
              const dateObj = new Date(d + 'T00:00:00');
              const isToday = d === todayStr;
              return (
                <div
                  key={d}
                  className={`p-3 rounded-xl border ${
                    isToday ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between mb-2">
                    <span>
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectContent(item)}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-400 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-slate-900 line-clamp-2">{item.title}</div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                          <span>{item.scheduled_time}</span>
                          <StatusBadge status={item.status} size="sm" showIcon={false} />
                        </div>
                      </div>
                    ))}
                    {dayItems.length === 0 && (
                      <div className="text-[11px] text-slate-400 text-center py-4">No content</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Daily Schedule: {selectedDay}
              </h3>
              <p className="text-xs text-slate-500">
                {getContentForDate(selectedDay).length} videos scheduled
              </p>
            </div>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-800 outline-none"
            />
          </div>

          <div className="divide-y divide-slate-100">
            {getContentForDate(selectedDay).map((item) => {
              const editor = allUsers.find(u => u.id === item.editor_id);
              const poster = allUsers.find(u => u.id === item.poster_id);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectContent(item)}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-3 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center text-xs font-bold text-slate-700">
                      {item.scheduled_time}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <PlatformBadge platform={item.platform} />
                        <span>Editor: <strong className="text-slate-700">{editor?.name}</strong></span>
                        <span>Poster: <strong className="text-slate-700">{poster?.name}</strong></span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={item.status} size="md" />
                </div>
              );
            })}
            {getContentForDate(selectedDay).length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No content scheduled for this date.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
