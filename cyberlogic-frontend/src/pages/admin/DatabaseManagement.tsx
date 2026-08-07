import { useState, useEffect, useRef } from "react";
import {
  Database,
  Download,
  RotateCcw,
  Trash2,
  Upload,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Shield,
  FileCode,
  Clock
} from "lucide-react";
import {
  fetchDatabaseBackups,
  downloadDatabaseBackup,
  deleteDatabaseBackup,
  uploadDatabaseBackup,
  fetchMaintenanceStatus,
  updateMaintenanceStatus,
  fetchAutoBackupSettings,
  updateAutoBackupSettings,
  triggerManualAutoBackup,
} from "../../utils/api";
import type { BackupItem, MaintenanceStatus, AutoBackupSettings } from "../../utils/api";
import { useDialog } from "../../utils/useDialog";
import { useSEO } from "../../utils/useSEO";
import { useAuth } from "../../context/AuthContext";
import { SkeletonLine } from "../../components/Skeleton";

export default function DatabaseManagement() {
  useSEO({
    title: "Database Backups & Lockdown Panel",
    description: "1-Click Database Backup, Restore with live ETA countdown, and Website Lockdown maintenance mode controls for Super Admins.",
  });

  const { showAlert, showConfirm } = useDialog();
  const { isSuperAdmin } = useAuth();

  // State
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [dbType, setDbType] = useState<string>("MySQL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Lockdown State
  const [maintenance, setMaintenance] = useState<MaintenanceStatus>({
    maintenance_mode: false,
    maintenance_title: "Scheduled Maintenance",
    maintenance_reason: "We are currently performing scheduled maintenance to upgrade system infrastructure and optimize speed.",
    maintenance_template: "scheduled_maintenance",
    maintenance_estimated_end: "",
  });
  const [isSavingMaintenance, setIsSavingMaintenance] = useState<boolean>(false);

  // Auto Backup Settings State
  const [autoBackup, setAutoBackup] = useState<AutoBackupSettings>({
    auto_backup_enabled: true,
    auto_backup_time: "02:00",
    auto_backup_max_files: 7,
    auto_backup_last_run: "",
  });
  const [isSavingAutoBackup, setIsSavingAutoBackup] = useState<boolean>(false);
  const [isRunningAutoBackup, setIsRunningAutoBackup] = useState<boolean>(false);

  // Active Streaming Task State (Backup or Restore)
  const [activeTask, setActiveTask] = useState<{
    type: "backup" | "restore";
    filename?: string;
    progress: number;
    step: string;
    elapsedSeconds: number;
    etaSeconds: number;
    status: "running" | "completed" | "failed";
    errorMessage?: string;
  } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Preset maintenance templates
  const maintenanceTemplates = [
    {
      id: "scheduled_maintenance",
      label: "🛠️ Scheduled Maintenance",
      title: "Scheduled System Maintenance",
      reason: "We are currently performing scheduled system updates to improve performance, security, and overall platform stability.",
    },
    {
      id: "emergency_maintenance",
      label: "⚡ Emergency Maintenance",
      title: "Emergency Server Maintenance",
      reason: "Our engineering team is actively investigating an urgent infrastructure issue. System access will resume shortly.",
    },
    {
      id: "database_restoration",
      label: "💾 Database Restoration",
      title: "Database Optimization & Sync",
      reason: "Database maintenance and backup synchronization are currently in progress. Full operations will resume once completed.",
    },
    {
      id: "platform_upgrade",
      label: "🚀 Platform Upgrade",
      title: "Major Platform Upgrade",
      reason: "Deploying exciting new features, cyberboard enhancements, and system upgrades. Stay tuned!",
    },
  ];

  // Load initial backups & maintenance status
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dbRes, maintRes, autoRes] = await Promise.all([
        fetchDatabaseBackups(),
        fetchMaintenanceStatus(),
        fetchAutoBackupSettings(),
      ]);
      setBackups(dbRes.backups || []);
      setDbType(dbRes.database_type || "MySQL");
      if (maintRes) setMaintenance(maintRes);
      if (autoRes) setAutoBackup(autoRes);
    } catch (err: any) {
      showAlert({ title: "Failed to Load Backups", message: err.message || "Failed to load database backups.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Prevent accidental page navigation / reload while restoration or backup is running
  useEffect(() => {
    if (!activeTask || activeTask.status !== "running") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "A database operation (restoration or backup) is currently running. Navigating away may disrupt the operation.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeTask?.status]);

  // Handle Auto Backup Settings Save
  const handleSaveAutoBackup = async () => {
    try {
      setIsSavingAutoBackup(true);
      const res = await updateAutoBackupSettings({
        auto_backup_enabled: autoBackup.auto_backup_enabled,
        auto_backup_time: autoBackup.auto_backup_time,
        auto_backup_max_files: Number(autoBackup.auto_backup_max_files),
      });
      if (res.settings) setAutoBackup(res.settings);
      showAlert({ title: "Auto-Backup Saved", message: "Automated daily backup configuration saved successfully!", type: "success" });
    } catch (err: any) {
      showAlert({ title: "Save Failed", message: err.message || "Failed to save auto-backup settings.", type: "error" });
    } finally {
      setIsSavingAutoBackup(false);
    }
  };

  // Handle Manual Execution Test for Auto-Backup
  const handleRunManualAutoBackupTest = async () => {
    try {
      setIsRunningAutoBackup(true);
      const res = await triggerManualAutoBackup();
      showAlert({
        title: "Auto-Backup Test Executed",
        message: `Backup snapshot (${res.result?.filename || "auto-backup.sql"}) created successfully! Pruned ${res.result?.pruned_count || 0} older files beyond the ${res.result?.max_files || 7}-file retention limit.`,
        type: "success",
      });
      loadData();
    } catch (err: any) {
      showAlert({ title: "Auto-Backup Failed", message: err.message || "Failed to run automated backup.", type: "error" });
    } finally {
      setIsRunningAutoBackup(false);
    }
  };

  // Handle Maintenance Template Selection
  const handleSelectTemplate = (templateId: string) => {
    const found = maintenanceTemplates.find((t) => t.id === templateId);
    if (found) {
      setMaintenance((prev) => ({
        ...prev,
        maintenance_template: found.id,
        maintenance_title: found.title,
        maintenance_reason: found.reason,
      }));
    }
  };

  // Toggle or Save Maintenance Settings
  const handleSaveMaintenance = async (newMode?: boolean) => {
    try {
      setIsSavingMaintenance(true);
      const targetMode = newMode !== undefined ? newMode : maintenance.maintenance_mode;
      const res = await updateMaintenanceStatus({
        ...maintenance,
        maintenance_mode: targetMode,
      });
      setMaintenance(res.status);
      showAlert({ title: "Lockdown Updated", message: res.message, type: "success" });
    } catch (err: any) {
      showAlert({ title: "Update Failed", message: err.message || "Failed to update website lockdown settings.", type: "error" });
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  // 1-Click Backup Stream Handler
  const handleTriggerBackup = () => {
    setActiveTask({
      type: "backup",
      progress: 0,
      step: "Connecting to database server...",
      elapsedSeconds: 0,
      etaSeconds: 0,
      status: "running",
    });

    const sseUrl = "/api/admin/database/backup-stream";
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "start") {
          setActiveTask((prev) => prev ? { ...prev, step: data.message, progress: 0 } : null);
        } else if (data.type === "progress") {
          setActiveTask((prev) =>
            prev
              ? {
                  ...prev,
                  step: `Exporting table: ${data.table} (${data.processed_tables}/${data.total_tables})...`,
                  progress: data.progress,
                  elapsedSeconds: data.elapsed_seconds,
                  etaSeconds: data.eta_seconds,
                }
              : null
          );
        } else if (data.type === "complete") {
          setActiveTask((prev) =>
            prev
              ? {
                  ...prev,
                  step: data.message,
                  progress: 100,
                  status: "completed",
                }
              : null
          );
          es.close();
          loadData();
        } else if (data.type === "error") {
          setActiveTask((prev) =>
            prev
              ? {
                  ...prev,
                  step: data.message,
                  status: "failed",
                  errorMessage: data.message,
                }
              : null
          );
          es.close();
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    es.onerror = (err) => {
      console.error("SSE Connection error:", err);
      setActiveTask((prev) =>
        prev
          ? {
              ...prev,
              status: "failed",
              errorMessage: "Connection to database backup stream interrupted.",
            }
          : null
      );
      es.close();
    };
  };

  // 1-Click Restore Stream Handler
  const handleTriggerRestore = async (filename: string) => {
    const confirmRestore = await showConfirm({
      title: "1-Click Restore Database Confirmation",
      message: `Are you sure you want to restore database from '${filename}'?\n\n⚠️ IMPORTANT: This will overwrite active database tables. An automatic pre-restore safety snapshot will be created first!`,
      type: "warning",
    });

    if (!confirmRestore) return;

    setActiveTask({
      type: "restore",
      filename,
      progress: 0,
      step: "Initializing restore sequence & creating pre-restore snapshot...",
      elapsedSeconds: 0,
      etaSeconds: 0,
      status: "running",
    });

    try {
      const response = await fetch("/api/admin/database/restore-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to initiate database restore stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.replace(/^data:\s*/, "").trim();
          if (!cleanLine) continue;

          try {
            const data = JSON.parse(cleanLine);
            if (data.type === "start") {
              setActiveTask((prev) => prev ? { ...prev, step: data.message, progress: 5 } : null);
            } else if (data.type === "progress") {
              setActiveTask((prev) =>
                prev
                  ? {
                      ...prev,
                      step: data.step || `Restoring database statements... (${data.bytes_formatted || ""})`,
                      progress: data.progress,
                      elapsedSeconds: data.elapsed_seconds,
                      etaSeconds: data.eta_seconds,
                    }
                  : null
              );
            } else if (data.type === "complete") {
              setActiveTask((prev) =>
                prev
                  ? {
                      ...prev,
                      step: data.message,
                      progress: 100,
                      status: "completed",
                    }
                  : null
              );
              loadData();
            } else if (data.type === "error") {
              setActiveTask((prev) =>
                prev
                  ? {
                      ...prev,
                      status: "failed",
                      errorMessage: data.message,
                    }
                  : null
              );
            }
          } catch (e) {
            console.error("Reader parse error:", e);
          }
        }
      }
    } catch (err: any) {
      setActiveTask((prev) =>
        prev
          ? {
              ...prev,
              status: "failed",
              errorMessage: err.message || "Database restore stream failed.",
            }
          : null
      );
    }
  };

  // Delete Backup File
  const handleDeleteBackup = async (filename: string) => {
    const confirmDelete = await showConfirm({
      title: "Delete Backup File",
      message: `Delete backup file '${filename}' permanently?`,
      type: "warning",
    });
    if (!confirmDelete) return;

    try {
      const res = await deleteDatabaseBackup(filename);
      showAlert({ title: "Backup Deleted", message: res.message, type: "success" });
      loadData();
    } catch (err: any) {
      showAlert({ title: "Delete Failed", message: err.message || "Failed to delete backup file.", type: "error" });
    }
  };

  // Upload Backup File Handler
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadDatabaseBackup(file);
      showAlert({ title: "Backup Uploaded", message: `${res.message} (${res.size_formatted})`, type: "success" });
      loadData();
    } catch (err: any) {
      showAlert({ title: "Upload Failed", message: err.message || "Failed to upload database file.", type: "error" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-surface-900/80 border border-border rounded-2xl text-rose-400">
        <Shield className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
        <p className="text-sm text-text-muted mt-1">
          Super Admin privileges are required to access Database Management & Website Lockdown settings.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn text-left pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-surface-900/80 border border-border/80 shadow-lg backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            <span>Super Admin Engine • {dbType}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-text-primary tracking-tight">
            Database Backups & Website Lockdown
          </h1>
          <p className="text-text-muted text-xs sm:text-sm max-w-2xl">
            Execute 1-Click Database Backups, 1-Click Restores with real-time percentage loading & ETA countdown, or toggle Website Lockdown for maintenance mode.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-surface-800 hover:bg-surface-700 text-text-secondary hover:text-text-primary rounded-xl transition-all border border-border cursor-pointer disabled:opacity-50"
            title="Refresh Backups List"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleTriggerBackup}
            disabled={!!activeTask}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ Create 1-Click Backup</span>
          </button>
        </div>
      </div>

      {/* Website Lockdown Control Panel Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-900/80 border border-border/80 space-y-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${maintenance.maintenance_mode ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-surface-800 border-border text-text-muted"}`}>
              {maintenance.maintenance_mode ? <Lock className="w-6 h-6 animate-pulse text-rose-400" /> : <Unlock className="w-6 h-6 text-text-muted" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span>Website Lockdown (Maintenance Mode)</span>
                {maintenance.maintenance_mode ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">Active</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-800 text-text-muted border border-border text-xs font-semibold">Public Access</span>
                )}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                When active, non-superadmin members and visitors are redirected to the Maintenance Webpage. Super Admins retain full access.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSaveMaintenance(!maintenance.maintenance_mode)}
            disabled={isSavingMaintenance}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              maintenance.maintenance_mode
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                : "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
            }`}
          >
            {maintenance.maintenance_mode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{maintenance.maintenance_mode ? "Disable Website Lockdown" : "Activate Website Lockdown"}</span>
          </button>
        </div>

        {/* Maintenance Templates & Reason Form */}
        <div className="space-y-4 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            Quick Maintenance Reason Templates
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {maintenanceTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  maintenance.maintenance_template === t.id
                    ? "bg-primary/10 border-primary/50 text-text-primary shadow-md shadow-primary/10"
                    : "bg-surface-950/60 border-border text-text-secondary hover:bg-surface-800/80"
                }`}
              >
                <div className="font-bold text-xs mb-1 text-text-primary">{t.label}</div>
                <div className="text-[11px] text-text-muted line-clamp-2">{t.reason}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-secondary">Notice Title Header</label>
              <input
                type="text"
                value={maintenance.maintenance_title}
                onChange={(e) => setMaintenance({ ...maintenance, maintenance_title: e.target.value })}
                placeholder="e.g. Scheduled System Maintenance"
                className="w-full px-4 py-2 bg-surface-950 border border-border rounded-xl text-text-primary text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-secondary">Estimated Completion Time (Optional Countdown)</label>
              <input
                type="datetime-local"
                value={maintenance.maintenance_estimated_end}
                onChange={(e) => setMaintenance({ ...maintenance, maintenance_estimated_end: e.target.value })}
                className="w-full px-4 py-2 bg-surface-950 border border-border rounded-xl text-text-primary text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary">Notice Explanation Message</label>
            <textarea
              rows={3}
              value={maintenance.maintenance_reason}
              onChange={(e) => setMaintenance({ ...maintenance, maintenance_reason: e.target.value })}
              placeholder="Detailed reason for maintenance..."
              className="w-full px-4 py-2 bg-surface-950 border border-border rounded-xl text-text-primary text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSaveMaintenance()}
              disabled={isSavingMaintenance}
              className="px-5 py-2.5 bg-surface-800 hover:bg-surface-700 text-text-primary font-semibold rounded-xl text-xs transition-all border border-border cursor-pointer"
            >
              Save Notice Template
            </button>
          </div>
        </div>
      </div>

      {/* Automated Daily Backup & Retention Policy Card */}
      <div className="p-6 rounded-2xl bg-surface-900/80 border border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Automated Daily Backup & Retention Policy</span>
            </h3>
            <p className="text-xs text-text-muted">
              Configure daily scheduled database snapshots and retention rules. Old automated backups beyond the set limit are automatically pruned.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunManualAutoBackupTest}
              disabled={isRunningAutoBackup}
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 border border-border text-text-primary text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-primary ${isRunningAutoBackup ? "animate-spin" : ""}`} />
              <span>{isRunningAutoBackup ? "Running Auto-Backup..." : "Run Auto-Backup Test Now"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Enable Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary">Automated Daily Backup</label>
            <button
              type="button"
              onClick={() => setAutoBackup({ ...autoBackup, auto_backup_enabled: !autoBackup.auto_backup_enabled })}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                autoBackup.auto_backup_enabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-surface-950 border-border text-text-muted"
              }`}
            >
              <span>{autoBackup.auto_backup_enabled ? "Enabled (Active)" : "Disabled"}</span>
              <div className={`w-4 h-4 rounded-full ${autoBackup.auto_backup_enabled ? "bg-emerald-400" : "bg-surface-700"}`} />
            </button>
          </div>

          {/* Scheduled Execution Time */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary">Scheduled Execution Time (Daily)</label>
            <select
              value={autoBackup.auto_backup_time}
              onChange={(e) => setAutoBackup({ ...autoBackup, auto_backup_time: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-950 border border-border rounded-xl text-text-primary text-xs focus:outline-none focus:border-primary font-mono cursor-pointer"
            >
              <option value="00:00">12:00 AM Midnight</option>
              <option value="01:00">01:00 AM</option>
              <option value="02:00">02:00 AM (Default / Recommended)</option>
              <option value="03:00">03:00 AM</option>
              <option value="04:00">04:00 AM</option>
              <option value="05:00">05:00 AM</option>
              <option value="06:00">06:00 AM</option>
              <option value="12:00">12:00 PM Noon</option>
              <option value="18:00">06:00 PM</option>
              <option value="22:00">10:00 PM</option>
            </select>
          </div>

          {/* Retention Limit (Max files) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary">Max Auto Backups to Retain</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={autoBackup.auto_backup_max_files}
                onChange={(e) => setAutoBackup({ ...autoBackup, auto_backup_max_files: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-surface-950 border border-border rounded-xl text-text-primary text-xs focus:outline-none focus:border-primary font-mono"
              />
              <button
                onClick={handleSaveAutoBackup}
                disabled={isSavingAutoBackup}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSavingAutoBackup ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Policy Info Strip */}
        <div className="p-3 bg-surface-950/60 border border-border/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Policy: Retaining <strong className="text-text-primary">{autoBackup.auto_backup_max_files} latest daily snapshots</strong>. Manual 1-Click backups are protected and never auto-pruned.
            </span>
          </span>
          {autoBackup.auto_backup_last_run && (
            <span className="font-mono text-[11px]">Last Auto-Backup: {autoBackup.auto_backup_last_run}</span>
          )}
        </div>
      </div>

      {/* Upload Custom Backup & Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-2xl bg-surface-900/80 border border-border/80 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-primary" />
              <span>Upload Custom Database Backup (.sql)</span>
            </h3>
            <p className="text-xs text-text-muted">
              Select or drag-and-drop any SQL dump file to upload it into the backup repository for instant 1-Click Restoration.
            </p>
          </div>

          <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center transition-all bg-surface-950/40">
            <input
              type="file"
              accept=".sql"
              onChange={handleUploadFile}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center gap-2">
              <FileCode className="w-8 h-8 text-primary/80" />
              <span className="text-xs font-semibold text-text-secondary">
                {isUploading ? "Uploading database file..." : "Click or drag .sql file here"}
              </span>
              <span className="text-[10px] text-text-muted">Maximum file size: 100MB</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-900/80 border border-border/80 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Restoration Safeguards</span>
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Every 1-Click Restore automatically creates a <span className="text-emerald-400 font-semibold">pre-restore safety snapshot</span> before altering active database tables.
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Disaster Rollback Enabled</span>
            </div>
            <p className="text-[11px] text-emerald-400/80">
              If an unintended restore occurs, you can revert instantly using the generated snapshot file.
            </p>
          </div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-900/80 border border-border/80 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span>Database Backup History ({backups.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`db-skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4"><SkeletonLine widthClass="w-52" heightClass="h-4" /></td>
                    <td className="py-3.5 px-4"><SkeletonLine widthClass="w-24" heightClass="h-4" /></td>
                    <td className="py-3.5 px-4"><SkeletonLine widthClass="w-16" heightClass="h-4" /></td>
                    <td className="py-3.5 px-4"><SkeletonLine widthClass="w-32" heightClass="h-4" /></td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <SkeletonLine widthClass="w-8" heightClass="h-8" />
                        <SkeletonLine widthClass="w-28" heightClass="h-8" />
                        <SkeletonLine widthClass="w-8" heightClass="h-8" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center border border-border rounded-xl bg-surface-950/40 text-text-muted space-y-3">
            <Database className="w-10 h-10 mx-auto text-text-muted/60" />
            <p className="text-xs font-semibold">No database backups found.</p>
            <p className="text-[11px] text-text-muted">Click "⚡ Create 1-Click Backup" above to generate your first backup snapshot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-surface-800/40 transition-all">
                    <td className="py-3 px-4 font-mono font-medium text-text-primary">
                      {b.filename}
                    </td>
                    <td className="py-3 px-4">
                      {b.is_auto_snapshot ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          Auto Snapshot
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                          Manual Backup
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-secondary">
                      {b.size_formatted}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {b.created_at}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadDatabaseBackup(b.filename)}
                          className="p-2 bg-surface-800 hover:bg-surface-700 text-text-primary rounded-lg transition-all border border-border cursor-pointer"
                          title="Download Backup SQL File"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" />
                        </button>

                        <button
                          onClick={() => handleTriggerRestore(b.filename)}
                          disabled={!!activeTask}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 disabled:opacity-50 text-xs cursor-pointer"
                          title="1-Click Restore Database"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>1-Click Restore</span>
                        </button>

                        <button
                          onClick={() => handleDeleteBackup(b.filename)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg transition-all border border-rose-800/40 cursor-pointer"
                          title="Delete Backup File"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live SSE Stream Progress & ETA Overlay Modal */}
      {activeTask && (
        <div className="fixed inset-0 bg-surface-950/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-surface-900 border border-border rounded-2xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
            
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
              {activeTask.type === "backup" ? (
                <Database className="w-8 h-8 animate-bounce" />
              ) : (
                <RotateCcw className="w-8 h-8 animate-spin" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text-primary">
                {activeTask.type === "backup" ? "Generating 1-Click Database Backup" : "Executing 1-Click Database Restoration"}
              </h3>
              <p className="text-xs text-text-muted">
                {activeTask.step}
              </p>
            </div>

            {/* Smooth Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-text-muted uppercase tracking-wider">Completion Rate</span>
                <span className="text-primary text-sm font-black">{activeTask.progress.toFixed(1)}%</span>
              </div>

              <div className="w-full h-4 bg-surface-950 rounded-full p-0.5 border border-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 shadow-md shadow-primary/30"
                  style={{ width: `${Math.max(3, activeTask.progress)}%` }}
                />
              </div>
            </div>

            {/* ETA Countdown & Timer Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-950/80 border border-border rounded-xl p-3 text-center">
                <span className="block text-[10px] text-text-muted uppercase font-semibold">Elapsed Time</span>
                <span className="text-base font-bold text-text-primary">{activeTask.elapsedSeconds.toFixed(1)}s</span>
              </div>

              <div className="bg-surface-950/80 border border-border rounded-xl p-3 text-center">
                <span className="block text-[10px] text-primary uppercase font-semibold">ETA Countdown</span>
                <span className="text-base font-bold text-primary">
                  {activeTask.status === "completed"
                    ? "Done!"
                    : activeTask.etaSeconds > 0
                    ? `${activeTask.etaSeconds.toFixed(1)}s remaining`
                    : "Calculating..."}
                </span>
              </div>
            </div>

            {/* Status alerts */}
            {activeTask.status === "completed" && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center justify-between">
                <span>Operation completed successfully!</span>
                <button
                  onClick={() => setActiveTask(null)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}

            {activeTask.status === "failed" && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-2">
                <div className="font-bold">Operation Error</div>
                <div className="text-[11px] text-rose-400/90">{activeTask.errorMessage}</div>
                <button
                  onClick={() => setActiveTask(null)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activeTask.status === "running" && (
              <p className="text-[11px] text-amber-400/90 animate-pulse font-medium">
                ⚠️ Please keep browser tab open until process finishes.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
