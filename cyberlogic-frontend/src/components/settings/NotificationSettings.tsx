import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";

export default function NotificationSettings() {
  const [emailBroadcasts, setEmailBroadcasts] = useState(true);
  const [emailReplies, setEmailReplies] = useState(true);
  const [emailEvents, setEmailEvents] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    const notifyPref = localStorage.getItem("cl-notifications");
    if (notifyPref) {
      try {
        const parsed = JSON.parse(notifyPref);
        setEmailBroadcasts(parsed.broadcasts ?? true);
        setEmailReplies(parsed.replies ?? true);
        setEmailEvents(parsed.events ?? false);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  const handleNotificationSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifications(true);
    setNotificationSuccess(false);

    setTimeout(() => {
      localStorage.setItem(
        "cl-notifications",
        JSON.stringify({ broadcasts: emailBroadcasts, replies: emailReplies, events: emailEvents })
      );
      setNotificationSuccess(true);
      setIsSavingNotifications(false);
      setTimeout(() => setNotificationSuccess(false), 3000);
    }, 500);
  };

  return (
    <div id="notifications" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
      <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
        <Bell className="w-4 h-4 text-success" /> Notification Preferences
      </h2>

      {notificationSuccess && (
        <div className="p-3 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
          ✓ Notification settings updated successfully.
        </div>
      )}

      <form onSubmit={handleNotificationSave} className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailBroadcasts}
              onChange={(e) => setEmailBroadcasts(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <div>
              <span className="text-xs font-semibold text-text-primary block">Official Announcements</span>
              <span className="text-[10px] text-text-muted block mt-0.5 leading-normal">
                Receive instant email alerts whenever a new official broadcast is pinned or published by directors.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailReplies}
              onChange={(e) => setEmailReplies(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <div>
              <span className="text-xs font-semibold text-text-primary block">Forum replies</span>
              <span className="text-[10px] text-text-muted block mt-0.5 leading-normal">
                Notify me via email when another club member replies or comments in a forum thread I created.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailEvents}
              onChange={(e) => setEmailEvents(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <div>
              <span className="text-xs font-semibold text-text-primary block">Event Reminders</span>
              <span className="text-[10px] text-text-muted block mt-0.5 leading-normal">
                Send me reminder alerts 24 hours prior to launch for events that I RSVP'd to.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingNotifications}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-text-primary border border-border text-xs font-semibold transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-success" /> {isSavingNotifications ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
