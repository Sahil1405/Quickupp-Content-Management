import React, { useState, useRef, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { UserAvatar } from './UserAvatar';
import { 
  Bell, 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  RotateCcw, 
  Film, 
  X, 
  Volume2, 
  BellRing, 
  Shield, 
  Send, 
  Rocket 
} from 'lucide-react';
import { 
  playNotificationSound, 
  requestBrowserNotificationPermission, 
  sendDesktopNotification, 
  getBrowserNotificationPermission 
} from '../lib/notificationService';

interface TopbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onOpenCreateModal: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSelectContentById?: (contentId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenCreateModal,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSelectContentById,
  searchQuery,
  onSearchChange,
  onToggleMobileMenu,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [soundTested, setSoundTested] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const soundMenuRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => !n.read);

  useEffect(() => {
    setPermissionState(getBrowserNotificationPermission());
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target as Node)) {
        setShowSoundMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnableAlerts = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermissionState(res);
    playNotificationSound();
    if (res === 'granted') {
      sendDesktopNotification('Browser Desktop Alerts Active ✓', {
        body: 'You will receive screen pop-up notifications with audio chime when tasks are assigned.',
      });
    }
  };

  const [activeTestType, setActiveTestType] = useState<string | null>(null);

  const handleTestSpecificAlert = (type: 'published' | 'completed' | 'revision' | 'issue' | 'assigned') => {
    playNotificationSound();
    setActiveTestType(type);
    setTimeout(() => setActiveTestType(null), 2500);

    const testConfigs = {
      published: {
        title: '🚀 Task Published: "Viral TikTok Showcase"',
        body: `${currentUser.name} published the video to TikTok & Instagram Reels. Post is now live!`,
      },
      completed: {
        title: '🎬 Task Completed: "Podcast Highlight Clip"',
        body: `Video editor finished rendering and uploaded the final cut. Ready for review & posting.`,
      },
      revision: {
        title: '🔁 Task Flagged for Revision: "Product Intro Hook"',
        body: `Reviewer flagged: "Please trim opening 2s and adjust audio leveling to -14 LUFS."`,
      },
      issue: {
        title: '⚠️ Review Flag / Issue: "Behind The Scenes"',
        body: `Issue flagged [aspect_ratio_wrong]: "Video was rendered in 16:9 instead of 9:16 vertical."`,
      },
      assigned: {
        title: '📋 New Task Assigned: "YouTube Short Ep #12"',
        body: `Manager assigned you as Video Editor (due today at 18:00). Click to view.`,
      },
    };

    const cfg = testConfigs[type];
    sendDesktopNotification(cfg.title, {
      body: cfg.body,
    });
  };

  const handleTestAlert = () => {
    handleTestSpecificAlert('assigned');
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'posted':
        return <Rocket className="w-4 h-4 text-emerald-600" />;
      case 'ready_to_post':
        return <Film className="w-4 h-4 text-teal-600" />;
      case 'revision':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'issue':
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'assigned':
        return <BellRing className="w-4 h-4 text-blue-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const roleBadgeConfig = {
    admin: {
      label: 'Workspace Admin',
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      dot: 'bg-purple-600',
      icon: <Shield className="w-3 h-3" />,
    },
    editor: {
      label: 'Video Editor',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      dot: 'bg-amber-600',
      icon: <Film className="w-3 h-3" />,
    },
    poster: {
      label: 'Posting Intern',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dot: 'bg-emerald-600',
      icon: <Send className="w-3 h-3" />,
    },
  }[currentUser.role];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Brand & Date */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              CF
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
                ContentFlow
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                Video Publishing Ops
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200 text-xs font-medium text-slate-500">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search content, platform, status..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors shrink-0"
              id="btn-create-content"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">+ Create Content</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}

          {/* Browser Alert & Chime Control */}
          <div className="relative" ref={soundMenuRef}>
            <button
              onClick={() => setShowSoundMenu(!showSoundMenu)}
              className={`relative p-2 rounded-lg transition-colors border ${
                permissionState === 'granted'
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/60'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Browser Pop-up & Audio Chime Settings"
              aria-label="Browser Notification Settings"
            >
              <Volume2 className="w-4 h-4" />
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${permissionState === 'granted' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </button>

            {showSoundMenu && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Browser &amp; Sound Alerts</h4>
                    <span className="text-[11px] text-slate-500">Assignment notification alerts</span>
                  </div>
                </div>

                <div className="py-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Desktop Pop-ups:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      permissionState === 'granted' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : permissionState === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {permissionState === 'granted' ? 'Active ✓' : permissionState === 'denied' ? 'Blocked in Browser' : 'Permission Needed'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Whenever a task is <strong>published</strong>, <strong>completed</strong>, <strong>reviewed / flagged for revision</strong>, or <strong>assigned</strong>, a desktop pop-up and audio chime will trigger immediately for all persons, even if working in another tab or program.
                  </p>

                  {permissionState !== 'granted' && permissionState !== 'unsupported' && (
                    <button
                      onClick={handleEnableAlerts}
                      className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Enable Browser Desktop Alerts</span>
                    </button>
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Test Global Pop-up Alerts:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleTestSpecificAlert('published')}
                        className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-left transition-colors flex items-center gap-1.5 ${
                          activeTestType === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                        }`}
                      >
                        <Rocket className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Published</span>
                      </button>

                      <button
                        onClick={() => handleTestSpecificAlert('completed')}
                        className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-left transition-colors flex items-center gap-1.5 ${
                          activeTestType === 'completed'
                            ? 'bg-teal-100 text-teal-800 border-teal-300'
                            : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border-slate-200'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">Completed</span>
                      </button>

                      <button
                        onClick={() => handleTestSpecificAlert('revision')}
                        className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-left transition-colors flex items-center gap-1.5 ${
                          activeTestType === 'revision'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border-slate-200'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Revision Flag</span>
                      </button>

                      <button
                        onClick={() => handleTestSpecificAlert('issue')}
                        className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-left transition-colors flex items-center gap-1.5 ${
                          activeTestType === 'issue'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">Review Issue</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleTestSpecificAlert('assigned')}
                      className="w-full mt-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>{activeTestType === 'assigned' ? 'Chime Played! ✓' : 'Test Task Assignment Alert'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    {unreadNotifications.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700">
                        {unreadNotifications.length} new
                      </span>
                    )}
                  </div>
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (notif.content_id && onSelectContentById) {
                            onSelectContentById(notif.content_id);
                            setShowNotifMenu(false);
                          }
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                          !notif.read ? 'bg-slate-50/70 font-medium' : ''
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 bg-white rounded-md border border-slate-200 shadow-2xs shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-semibold text-slate-900 truncate">
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Profile & Identity Switcher */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all bg-white shadow-2xs"
              id="btn-admin-profile"
            >
              <UserAvatar user={currentUser} size="sm" />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${roleBadgeConfig.color.split(' ')[0]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleBadgeConfig.dot} inline-block`} />
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <UserAvatar user={currentUser} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <div className="pt-2 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Active Role:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-md border text-[10px] tracking-wider uppercase flex items-center gap-1 ${roleBadgeConfig.color}`}>
                      {roleBadgeConfig.icon}
                      {roleBadgeConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Access Scope:</span>
                    <span className="font-medium text-slate-800">
                      {currentUser.role === 'admin'
                        ? 'Full Management & Creation'
                        : currentUser.role === 'editor'
                        ? 'Assigned Video Production'
                        : 'Assigned Publishing Queue'}
                    </span>
                  </div>
                </div>

                {/* Team member accounts if more than 1 user */}
                {allUsers.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Switch Active View
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {allUsers.map((u) => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u.id);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                              isSelected
                                ? 'bg-slate-100 font-bold text-slate-900'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar user={u} size="sm" />
                              <div className="text-left truncate">
                                <div className="font-semibold text-slate-800">{u.name}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-tight">
                                  {u.role === 'admin' ? 'Admin' : u.role === 'editor' ? 'Editor' : 'Intern'}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
