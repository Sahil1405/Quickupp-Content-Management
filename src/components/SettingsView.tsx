import React, { useState } from 'react';
import { 
  Settings, 
  Clock, 
  Share2, 
  HardDrive, 
  RotateCcw, 
  Save, 
  Check, 
  Sliders,
  Bell,
  ShieldCheck
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [teamName, setTeamName] = useState('ContentFlow Media Operations');
  const [timezone, setTimezone] = useState('America/New_York (UTC-4)');
  const [enableInstagram, setEnableInstagram] = useState(true);
  const [enableTikTok, setEnableTikTok] = useState(true);
  const [enableShorts, setEnableShorts] = useState(true);
  const [enableLinkedIn, setEnableLinkedIn] = useState(true);
  const [enableX, setEnableX] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Workspace Operations Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure publication timezones, active social channels, and handoff defaults.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400">
            1. Team &amp; Localization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Media Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publishing Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
              >
                <option value="America/New_York (UTC-4)">America/New_York (Eastern)</option>
                <option value="America/Los_Angeles (UTC-7)">America/Los_Angeles (Pacific)</option>
                <option value="Europe/London (UTC+1)">Europe/London (GMT/BST)</option>
                <option value="Asia/Kolkata (UTC+5:30)">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai (UTC+4)">Asia/Dubai (GST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enabled Platforms */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400">
            2. Active Distribution Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Instagram Reels</span>
              <input
                type="checkbox"
                checked={enableInstagram}
                onChange={(e) => setEnableInstagram(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
            </label>

            <label className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">TikTok</span>
              <input
                type="checkbox"
                checked={enableTikTok}
                onChange={(e) => setEnableTikTok(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
            </label>

            <label className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">YouTube Shorts</span>
              <input
                type="checkbox"
                checked={enableShorts}
                onChange={(e) => setEnableShorts(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
            </label>

            <label className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">LinkedIn Video</span>
              <input
                type="checkbox"
                checked={enableLinkedIn}
                onChange={(e) => setEnableLinkedIn(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
            </label>

            <label className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">X (Twitter)</span>
              <input
                type="checkbox"
                checked={enableX}
                onChange={(e) => setEnableX(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Video Storage & System Health */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400">
            3. Server &amp; Video Storage Engine
          </h3>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  High-Bitrate Video Asset Store
                </span>
                <span className="text-[11px] text-slate-500">
                  Full original video files served at native resolution with direct browser download
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Optimal (100% Online)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
