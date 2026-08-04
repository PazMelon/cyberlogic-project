import React, { useState, useEffect } from "react";
import { User, Save, Globe, Code2, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");

  // Digital Presence States
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [wechat, setWechat] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState(""); // X
  const [reddit, setReddit] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setMiddleName(user.middle_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || "");
      setYearLevel(user.year_level || "");
      setDepartment(user.department || "");
      setAddress(user.address || "");
      setBirthday(user.birthday ? user.birthday.split("T")[0] : "");
      setBio(user.bio || "");
      setExpertise(user.expertise || "");
      setGithub(user.github || "");
      setLinkedin(user.linkedin || "");
      setFacebook(user.facebook || "");
      setInstagram(user.instagram || "");
      setWechat(user.wechat || "");
      setTiktok(user.tiktok || "");
      setTwitter(user.twitter || "");
      setReddit(user.reddit || "");
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("First name and Last name are required.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile({
        username: username.trim() || null,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        year_level: yearLevel || null,
        department: department || null,
        address: address || null,
        birthday: birthday || null,
        bio: bio || null,
        expertise: expertise || null,
        github: github.trim() || null,
        linkedin: linkedin.trim() || null,
        facebook: facebook.trim() || null,
        instagram: instagram.trim() || null,
        wechat: wechat.trim() || null,
        tiktok: tiktok.trim() || null,
        twitter: twitter.trim() || null,
        reddit: reddit.trim() || null,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div id="profile" className="glass rounded-3xl p-6 sm:p-8 border border-border/80 space-y-8 shadow-xl scroll-mt-20 text-left">
      {/* Module Title Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Personal Profile & Digital Presence</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Update your account details, department standing, bio, technical skills, and social links.
            </p>
          </div>
        </div>
      </div>

      {profileSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold animate-fadeIn flex items-center gap-2">
          <span>✓</span> Personal profile and social links updated successfully.
        </div>
      )}
      {profileError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-semibold animate-fadeIn flex items-center gap-2">
          <span>✗</span> {profileError}
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider text-primary">
            1. Basic Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="set-fn" className="text-[10px] font-bold text-text-secondary uppercase">First Name</label>
              <input
                id="set-fn"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="set-mn" className="text-[10px] font-bold text-text-secondary uppercase">Middle Name</label>
              <input
                id="set-mn"
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="set-ln" className="text-[10px] font-bold text-text-secondary uppercase">Last Name</label>
              <input
                id="set-ln"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="set-username" className="text-[10px] font-bold text-text-secondary uppercase">Username / Handle</label>
              <input
                id="set-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                placeholder="e.g. pazmelon"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="set-email" className="text-[10px] font-bold text-text-secondary uppercase">Email Address (Read-only)</label>
              <input
                id="set-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900/40 border border-border/60 text-xs text-text-muted cursor-not-allowed opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="set-sid" className="text-[10px] font-bold text-text-secondary uppercase">Student ID (Read-only)</label>
              <input
                id="set-sid"
                type="text"
                value={user?.school_id || ""}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900/40 border border-border/60 text-xs text-text-muted cursor-not-allowed opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Department & Academic Standing */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span>2. Academic Department & Standing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="set-dept" className="text-[10px] font-bold text-text-secondary uppercase">Department / Course</label>
              <input
                id="set-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Studies (BSCS)"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-year" className="text-[10px] font-bold text-text-secondary uppercase">Year Level / Standing</label>
              <select
                id="set-year"
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all cursor-pointer"
              >
                <option value="">Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-bday" className="text-[10px] font-bold text-text-secondary uppercase">Birthday</label>
              <input
                id="set-bday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-addr" className="text-[10px] font-bold text-text-secondary uppercase">Location / Address</label>
            <input
              id="set-addr"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Building A, Main Campus"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>
        </div>

        {/* Section 3: Biography & Core Technical Skills */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Code2 className="w-4 h-4" />
            <span>3. Bio & Core Technical Skills</span>
          </h3>

          <div className="space-y-1.5">
            <label htmlFor="set-exp" className="text-[10px] font-bold text-text-secondary uppercase">Core Technical Skills (Comma-separated)</label>
            <input
              id="set-exp"
              type="text"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="e.g. React, Laravel, Python, Cybersecurity, UI/UX"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="set-bio" className="text-[10px] font-bold text-text-secondary uppercase">Biography Summary</label>
            <textarea
              id="set-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Share a short bio about your passions, interests, and role in Cyberlogic Club..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all resize-none"
            />
          </div>
        </div>

        {/* Section 4: Digital Presence & Social Links */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Globe className="w-4 h-4" />
            <span>4. Digital Presence & Social Connections</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="set-fb" className="text-[10px] font-bold text-text-secondary uppercase">Facebook</label>
              <input
                id="set-fb"
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-ig" className="text-[10px] font-bold text-text-secondary uppercase">Instagram</label>
              <input
                id="set-ig"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="instagram.com/username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-wechat" className="text-[10px] font-bold text-text-secondary uppercase">WeChat</label>
              <input
                id="set-wechat"
                type="text"
                value={wechat}
                onChange={(e) => setWechat(e.target.value)}
                placeholder="WeChat ID or link"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-tiktok" className="text-[10px] font-bold text-text-secondary uppercase">TikTok</label>
              <input
                id="set-tiktok"
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="tiktok.com/@username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-twitter" className="text-[10px] font-bold text-text-secondary uppercase">X (Twitter)</label>
              <input
                id="set-twitter"
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="x.com/username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-reddit" className="text-[10px] font-bold text-text-secondary uppercase">Reddit</label>
              <input
                id="set-reddit"
                type="text"
                value={reddit}
                onChange={(e) => setReddit(e.target.value)}
                placeholder="reddit.com/user/username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-gh" className="text-[10px] font-bold text-text-secondary uppercase">GitHub</label>
              <input
                id="set-gh"
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="github.com/username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-linkedin" className="text-[10px] font-bold text-text-secondary uppercase">LinkedIn</label>
              <input
                id="set-linkedin"
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/username"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-900 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end pt-4 border-t border-border/40">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSavingProfile ? "Saving profile..." : "Save All Details & Social Links"}
          </button>
        </div>
      </form>
    </div>
  );
}
