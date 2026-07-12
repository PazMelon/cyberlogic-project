import React, { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
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
    <div id="profile" className="glass rounded-2xl p-5 sm:p-6 border border-border space-y-5 scroll-mt-20">
      <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
        <User className="w-4 h-4 text-primary" /> Edit Profile Details
      </h2>

      {profileSuccess && (
        <div className="p-3 rounded-xl bg-success/15 border border-success/35 text-xs text-success font-medium animate-fadeIn">
          ✓ Personal profile details saved successfully.
        </div>
      )}
      {profileError && (
        <div className="p-3 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
          ✗ {profileError}
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="set-fn" className="text-[10px] font-semibold text-text-secondary uppercase">First Name</label>
            <input
              id="set-fn"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="set-mn" className="text-[10px] font-semibold text-text-secondary uppercase">Middle Name</label>
            <input
              id="set-mn"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="set-ln" className="text-[10px] font-semibold text-text-secondary uppercase">Last Name</label>
            <input
              id="set-ln"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="set-username" className="text-[10px] font-semibold text-text-secondary uppercase">Username / Nickname (No spaces)</label>
          <input
            id="set-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
            placeholder="e.g. pazmelon"
            className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            maxLength={50}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="set-email" className="text-[10px] font-semibold text-text-secondary uppercase">Email Address</label>
            <input
              id="set-email"
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800/40 border border-border text-xs text-text-muted cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="set-sid" className="text-[10px] font-semibold text-text-secondary uppercase">Student ID</label>
            <input
              id="set-sid"
              type="text"
              value={user?.school_id || ""}
              disabled
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800/40 border border-border text-xs text-text-muted cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="set-year" className="text-[10px] font-semibold text-text-secondary uppercase">Year Level</label>
            <select
              id="set-year"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="5th Year">5th Year</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="set-dept" className="text-[10px] font-semibold text-text-secondary uppercase">Department</label>
            <select
              id="set-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            >
              <option value="">Select Dept</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Teacher Education">Teacher Education</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Criminal Justice Education">Criminal Justice Education</option>
              <option value="Hospitality Management">Hospitality Management</option>
              <option value="RVM-TTP">RVM-TTP</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="set-bday" className="text-[10px] font-semibold text-text-secondary uppercase">Birthday</label>
            <input
              id="set-bday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="set-addr" className="text-[10px] font-semibold text-text-secondary uppercase">Address Details</label>
          <input
            id="set-addr"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House No, Street, City, Province"
            className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="set-exp" className="text-[10px] font-semibold text-text-secondary uppercase">Expertise & Skills</label>
          <input
            id="set-exp"
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="Network Security, Ethical Hacking, Python"
            className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="set-bio" className="text-[10px] font-semibold text-text-secondary uppercase">Bio Details</label>
          <textarea
            id="set-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell us about yourself..."
            className="w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> {isSavingProfile ? "Saving..." : "Save details"}
          </button>
        </div>
      </form>
    </div>
  );
}
