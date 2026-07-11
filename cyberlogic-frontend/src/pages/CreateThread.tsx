import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Upload, 
  Sparkles,
  Info,
  BarChart2
} from "lucide-react";
import { fetchForumCategories, createForumThread, fetchUsers, type ForumCategoryMapped, type DbUser } from "../utils/api";
import { Button } from "../components/ui";
import { useDialog } from "../utils/useDialog";

import { useSEO } from "../utils/useSEO";

function getCaretCoordinates(textarea: HTMLTextAreaElement, position: number) {
  const div = document.createElement("div");
  const style = window.getComputedStyle(textarea);
  const properties = [
    "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
    "borderWidth", "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontSizeAdjust",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "textDecoration",
    "letterSpacing", "wordSpacing", "tabSize", "MozTabSize", "whiteSpace", "wordBreak", "wordWrap"
  ];
  properties.forEach(prop => {
    (div.style as any)[prop] = (style as any)[prop];
  });
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  document.body.appendChild(div);
  const text = textarea.value.substring(0, position);
  div.textContent = text;
  const span = document.createElement("span");
  span.textContent = textarea.value.substring(position) || ".";
  div.appendChild(span);
  const coordinates = {
    top: span.offsetTop + parseInt(style.borderTopWidth || "0") - textarea.scrollTop,
    left: span.offsetLeft + parseInt(style.borderLeftWidth || "0") - textarea.scrollLeft
  };
  document.body.removeChild(div);
  return coordinates;
}

export default function CreateThread() {
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });
  useSEO({
    title: "Create New Thread",
    description: "Start a new conversation or ask a question in Cyberlogic forums.",
  });

  const navigate = useNavigate();
  const { showAlert } = useDialog();
  const [categories, setCategories] = useState<ForumCategoryMapped[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const isSpoiler = false;
  const isRedacted = false;

  // Mentions autocomplete states
  const [users, setUsers] = useState<DbUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.error("Failed to load users for mentions", err));
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    const selectionStart = e.target.selectionStart;

    const lastAtIdx = val.lastIndexOf("@", selectionStart - 1);
    if (lastAtIdx !== -1) {
      const charBeforeAt = lastAtIdx > 0 ? val[lastAtIdx - 1] : " ";
      const textAfterAt = val.substring(lastAtIdx + 1, selectionStart);

      if (
        (charBeforeAt === " " || charBeforeAt === "\n") &&
        !textAfterAt.includes(" ")
      ) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIdx);
        setActiveMentionIndex(0);

        if (textareaRef.current) {
          const coords = getCaretCoordinates(textareaRef.current, lastAtIdx);
          setMentionCoords(coords);
        }
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMentionUser = (username: string) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;
    const beforeMention = content.substring(0, mentionStartIndex);
    const afterMention = content.substring(textareaRef.current.selectionStart);

    const newText = `${beforeMention}@${username} ${afterMention}`;
    setContent(newText);
    setShowMentions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = beforeMention.length + username.length + 2; // @ + space
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const filteredUsers = (users || [])
    .filter((u) => u.status === "approved")
    .filter((u) => {
      const q = mentionQuery.toLowerCase();
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const username = (u.username || "").toLowerCase();
      return fullName.includes(q) || username.includes(q);
    });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selectedUser = filteredUsers[activeMentionIndex];
        const uName = selectedUser.username || `${selectedUser.first_name}${selectedUser.last_name}`.toLowerCase();
        selectMentionUser(uName);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
  };
  
  // Tab control: 'post' | 'images' | 'poll'
  const [activeTab, setActiveTab] = useState<"post" | "images" | "poll">("post");
  
  // Poll states
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const handleAddPollOption = () => {
    if (pollOptions.length >= 10) {
      showAlert({
        title: "Limit Exceeded",
        message: "You can add a maximum of 10 options.",
        type: "warning",
      });
      return;
    }
    setPollOptions([...pollOptions, ""]);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      showAlert({
        title: "Minimum Required",
        message: "A poll must have at least 2 options.",
        type: "warning",
      });
      return;
    }
    const newOpts = [...pollOptions];
    newOpts.splice(index, 1);
    setPollOptions(newOpts);
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const newOpts = [...pollOptions];
    newOpts[index] = val;
    setPollOptions(newOpts);
  };
  
  // Selected files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        setIsLoadingCats(true);
        const data = await fetchForumCategories();
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].dbId.toString()); // Default to first category
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        setErrorMsg("Failed to load forum categories.");
      } finally {
        setIsLoadingCats(false);
      }
    }
    loadCats();
  }, []);

  // Handle image files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Max 5 images
    if (selectedFiles.length + files.length > 5) {
      showAlert({
        title: "Upload Limit",
        message: "You can upload a maximum of 5 images.",
        type: "warning",
      });
      return;
    }

    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        showAlert({
          title: "Unsupported Format",
          message: "Only image files are allowed.",
          type: "warning",
        });
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];
    
    // Revoke object URL to avoid leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Thread title is required.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Thread text content is required.");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Please select a category.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      // Build Multipart Form Data (necessary for file uploads)
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("category_id", categoryId);
      formData.append("is_spoiler", isSpoiler ? "1" : "0");
      formData.append("is_redacted", isRedacted ? "1" : "0");
      
      selectedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      if (hasPoll) {
        if (!pollQuestion.trim()) {
          setErrorMsg("Poll question is required if poll is enabled.");
          return;
        }
        const filledOptions = pollOptions.filter(o => o.trim() !== "");
        if (filledOptions.length < 2) {
          setErrorMsg("A poll must have at least 2 non-empty options.");
          return;
        }
        formData.append("poll_question", pollQuestion.trim());
        formData.append("poll_options", JSON.stringify(filledOptions));
      }

      const newThread = await createForumThread(formData);
      navigate(`/app/forums/thread/${newThread.id}`);
    } catch (err: any) {
      console.error("Failed to create thread:", err);
      setErrorMsg(err.message || "Failed to create thread. Check file sizes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          to="/app/forums"
          className="p-2 rounded-xl bg-white/5 border border-border/40 text-text-secondary hover:text-text-primary hover:border-border/60 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            Create a New Thread
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Share ideas, CTF guides, or request support in the Cyberlogic community.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Form container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-5 border border-border/30 space-y-5">
          {/* Category Select & Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-[family-name:var(--font-heading)]">
                Category Slug
              </label>
              {isLoadingCats ? (
                <div className="h-10 rounded-xl bg-surface-900/40 border border-border/20 animate-pulse" />
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-semibold transition-all"
                >
                  {categories.map((c) => (
                    <option key={c.dbId} value={c.dbId}>
                      {c.name} ({c.type === "support" ? "Support Requests" : "Discussion"})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Direct Warning Labels */}
            <div className="flex flex-col justify-end">
              <div className="text-[10px] text-text-muted bg-surface-900/30 border border-border/10 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  {categories.find((c) => c.dbId.toString() === categoryId)?.allow_solved 
                    ? "Threads in this category support marking replies as the accepted solution."
                    : "This category is for general discussions. Solution marking is not enabled here."}
                </span>
              </div>
            </div>
          </div>

          {/* Category Rules & Guidelines */}
          {categories.find((c) => c.dbId.toString() === categoryId)?.rules && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary flex items-start gap-2 animate-fadeIn">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-text-primary mb-0.5">Category Guidelines</p>
                <p className="whitespace-pre-wrap leading-relaxed text-text-muted">{categories.find((c) => c.dbId.toString() === categoryId)?.rules}</p>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-[family-name:var(--font-heading)]">
              Title
            </label>
            <input
              type="text"
              placeholder="An interesting cyber title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
              disabled={isSubmitting}
              className="w-full h-11 px-4 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-semibold placeholder:text-text-muted/50 transition-all shadow-inner"
            />
          </div>

          {/* Tab Selection (Reddit-style tabs: Text Post / Image Uploader) */}
          <div className="border-b border-border/20 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("post")}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "post"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <FileText className="w-4 h-4" />
              Post Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("images")}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "images"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images ({selectedFiles.length} / 5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("poll")}
              className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "poll"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Poll {hasPoll ? "(Active)" : ""}
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[220px]">
            {activeTab === "post" ? (
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest font-[family-name:var(--font-heading)]">
                  Description
                </label>
                <textarea
                  ref={textareaRef}
                  placeholder="Draft your post details here... (Supports standard HTML content or plain text. Use ||spoiler|| for inline spoilers)"
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  rows={8}
                  required
                  disabled={isSubmitting}
                  className="w-full p-4 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-medium placeholder:text-text-muted/40 transition-all font-[family-name:var(--font-mono)]"
                />

                {/* Autocomplete Popover */}
                {showMentions && filteredUsers.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${mentionCoords.top + 24}px`,
                      left: `${mentionCoords.left}px`,
                    }}
                    className="w-64 bg-surface-900 border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn"
                  >
                    <div className="px-3 py-1.5 bg-surface-950 border-b border-border text-[9px] uppercase tracking-wider font-bold text-text-muted">
                      Mention Users
                    </div>
                    <div className="max-h-40 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                      {filteredUsers.map((user, idx) => {
                        const uName = user.username || `${user.first_name}${user.last_name}`.toLowerCase();
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectMentionUser(uName)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                              idx === activeMentionIndex
                                ? "bg-primary/20 text-primary"
                                : "text-text-secondary hover:bg-surface-800 hover:text-text-primary"
                            }`}
                          >
                            <img
                              src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.first_name}`}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-medium">{`${user.first_name} ${user.last_name}`}</span>
                              <span className="text-[10px] text-text-muted ml-2">@{uName}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "images" ? (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest font-[family-name:var(--font-heading)]">
                  Media Attachments
                </label>
                
                {/* Upload drag drop panel */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/40 hover:border-primary/40 rounded-xl cursor-pointer bg-surface-950/20 hover:bg-surface-950/40 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <Upload className="w-8 h-8 text-text-muted group-hover:text-primary group-hover:scale-110 transition-all mb-2" />
                    <p className="text-xs text-text-secondary font-bold tracking-wide">
                      Click to upload or drag & drop files
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      PNG, JPG, JPEG, GIF (Max. 5 images, up to 4MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>

                {/* File previews grid */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative group/thumb rounded-lg overflow-hidden aspect-square border border-border/30 bg-black">
                        <img
                          src={preview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                        />
                        
                        {/* Remove Overlay Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200"
                        >
                          <Trash2 className="w-5 h-5 text-error hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-border/10">
                  <div>
                    <label className="text-sm font-bold text-text-primary">Enable Poll</label>
                    <p className="text-[10px] text-text-muted">Attach a vote/poll to this thread.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPoll}
                    onChange={(e) => setHasPoll(e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </div>

                {hasPoll && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-[family-name:var(--font-heading)]">
                        Question / Poll Title
                      </label>
                      <input
                        type="text"
                        placeholder="What do you think about...?"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        maxLength={255}
                        disabled={isSubmitting}
                        className="w-full h-11 px-4 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-semibold placeholder:text-text-muted/50 transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest font-[family-name:var(--font-heading)]">
                        Poll Options
                      </label>
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                            maxLength={255}
                            disabled={isSubmitting}
                            className="flex-1 h-10 px-3 bg-surface-950 border border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 rounded-xl text-text-primary text-sm font-semibold placeholder:text-text-muted/50 transition-all"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(index)}
                              className="p-2 rounded-lg bg-error/10 hover:bg-error/20 border border-error/20 text-error transition-all shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="mt-2 text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1 transition-colors"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action button rows */}
        <div className="flex justify-end gap-3">
          <Link to="/app/forums">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              className="px-6 py-2.5"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="px-6 py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            Publish Thread
          </Button>
        </div>
      </form>
    </div>
  );
}
