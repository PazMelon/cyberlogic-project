import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, Save, User as UserIcon, GraduationCap, Calendar, FileText, Wrench } from "lucide-react";

export function AccountGateModal() {
  const { user, updateProfile } = useAuth();

  // If there's no user, or user is superadmin, we don't block
  if (!user || user.role === "superadmin") {
    return null;
  }

  // Check if any minimum required field is missing
  const isMissingFields =
    !user.first_name?.trim() ||
    !user.last_name?.trim() ||
    !user.username?.trim() ||
    !user.year_level?.trim() ||
    !user.department?.trim() ||
    !user.birthday?.trim() ||
    !user.expertise?.trim() ||
    !user.bio?.trim();

  // If nothing is missing, we don't display the modal
  if (!isMissingFields) {
    return null;
  }

  // Form States
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [birthday, setBirthday] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize fields
  useEffect(() => {
    setFirstName(user.first_name || "");
    setMiddleName(user.middle_name || "");
    setLastName(user.last_name || "");
    setUsername(user.username || "");
    setYearLevel(user.year_level || "");
    setDepartment(user.department || "");
    setBirthday(user.birthday ? user.birthday.split("T")[0] : "");
    setExpertise(user.expertise || "");
    setBio(user.bio || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!firstName.trim()) return setError("First Name is required.");
    if (!lastName.trim()) return setError("Last Name is required.");
    if (!username.trim()) return setError("Username is required.");
    if (!yearLevel) return setError("Year Level is required.");
    if (!department) return setError("Department is required.");
    if (!birthday) return setError("Birthday is required.");
    if (!expertise.trim()) return setError("Expertise & Skills are required.");
    if (!bio.trim()) return setError("Bio details are required.");

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        username: username.trim().replace(/\s+/g, ""),
        year_level: yearLevel,
        department: department,
        birthday: birthday || null,
        expertise: expertise.trim(),
        bio: bio.trim(),
      });
    } catch (err: any) {
      setError(err.message || "Failed to update account details. Make sure the username is unique.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-surface-950/80 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface-900 border border-primary/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(var(--color-primary-rgb),0.15)] glass my-8 animate-dialog-content">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-5 mb-6">
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight font-heading">
              Configure Your Account
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Before using the forums and chat room, please complete your profile setup with the required information.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Personal Info */}
          <div>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Nickname & Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Username / Nickname *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                placeholder="e.g. johndoe"
                maxLength={50}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> Birthday *
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Section: Academic Details */}
          <div>
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" /> Academic Affiliation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Year Level *</label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  required
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Department / Course *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Systems">Information Systems</option>
                  <option value="Teacher Education">Teacher Education</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Criminal Justice Education">Criminal Justice Education</option>
                  <option value="Hospitality Management">Hospitality Management</option>
                  <option value="RVM-TTP">RVM-TTP</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Professional details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-primary" /> Expertise & Skills *
              </label>
              <input
                type="text"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="e.g. Cybersecurity, Web Development, Python"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" /> Bio Details *
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell the community about yourself..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving Configuration..." : "Save and Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
