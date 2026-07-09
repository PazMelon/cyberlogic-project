import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Shield, Edit2, UserPlus } from "lucide-react";
import { 
  fetchAdminOfficers, 
  createOfficer, 
  updateOfficer, 
  deleteOfficer, 
  reorderOfficers 
} from "../../../utils/api";
import { useDialog } from "../../../utils/useDialog";
import type { Officer } from "../../../utils/api";
import OfficerEditModal from "./OfficerEditModal";

export default function AboutOfficerSettings() {
  const { showAlert, showConfirm } = useDialog();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  const loadOfficers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAdminOfficers();
      setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  const handleAdd = () => {
    setSelectedOfficer(null);
    setModalOpen(true);
  };

  const handleEdit = (officer: Officer) => {
    setSelectedOfficer(officer);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Remove Officer",
      message: "Are you sure you want to remove this officer?",
      type: "danger",
      confirmText: "Remove",
    });

    if (confirmed) {
      try {
        await deleteOfficer(id);
        setOfficers((prev) => prev.filter((o) => o.id !== id));
      } catch (err) {
        showAlert({
          title: "Removal Failed",
          message: "Failed to remove officer.",
          type: "error",
        });
      }
    }
  };

  const handleSaveModal = async (data: Partial<Officer>) => {
    try {
      if (selectedOfficer) {
        // Update
        await updateOfficer(selectedOfficer.id, data);
        // Refresh full list to resolve relationships correctly
        await loadOfficers();
      } else {
        // Create
        await createOfficer(data);
        await loadOfficers();
      }
      setModalOpen(false);
    } catch (err: any) {
      showAlert({
        title: "Save Failed",
        message: err.message || "Failed to save officer.",
        type: "error",
      });
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    setIsSavingOrder(true);
    try {
      const updated = [...officers];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      
      setOfficers(updated);
      
      // Persist order on backend
      const ids = updated.map((o) => o.id);
      await reorderOfficers(ids);
    } catch (err) {
      showAlert({
        title: "Reorder Failed",
        message: "Failed to update officer ordering.",
        type: "error",
      });
      loadOfficers(); // Reload to restore previous state
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === officers.length - 1) return;
    setIsSavingOrder(true);
    try {
      const updated = [...officers];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      
      setOfficers(updated);
      
      // Persist order on backend
      const ids = updated.map((o) => o.id);
      await reorderOfficers(ids);
    } catch (err) {
      showAlert({
        title: "Reorder Failed",
        message: "Failed to update officer ordering.",
        type: "error",
      });
      loadOfficers();
    } finally {
      setIsSavingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text-muted">Loading officers directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex justify-between items-center bg-surface-900/50 p-4 rounded-xl border border-border/40">
        <div>
          <span className="text-xs font-bold text-text-primary block">Officers Directory Builder</span>
          <span className="text-[10px] text-text-muted">Manage the landing page carousel of officers, linkage to member accounts, and custom overrides.</span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 hover:bg-primary text-text-primary text-xs font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Configure Officer
        </button>
      </div>

      {/* Officers List Grid */}
      {officers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/50 rounded-2xl">
          <Shield className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30 animate-pulse" />
          <h4 className="text-sm font-bold text-text-secondary">No Officers Configured</h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1.5 leading-relaxed font-sans">
            Add officers to display in the About Us directory. You can link them directly to approved user accounts.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Your First Officer
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {isSavingOrder && (
            <div className="text-center text-[10px] text-primary font-bold animate-pulse">
              Saving order modifications to server...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officers.map((officer, idx) => {
              return (
                <div
                  key={officer.id}
                  className="glass rounded-2xl p-5 border border-border/40 hover:border-accent/25 transition-all duration-300 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4 text-left">
                    <img
                      src={officer.avatar}
                      alt={officer.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-border/50 bg-surface-800 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-text-primary">{officer.name}</span>
                        {officer.user_id && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-primary/20 border border-primary/40 text-primary uppercase tracking-wider">
                            Linked Account
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-accent font-semibold tracking-wider uppercase block">
                        {officer.role}
                      </span>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-sans pt-1">
                        {officer.bio || "No biography provided."}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(officer)}
                      title="Edit officer details"
                      className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0 || isSavingOrder}
                      title="Move Up"
                      className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === officers.length - 1 || isSavingOrder}
                      title="Move Down"
                      className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(officer.id)}
                      title="Remove officer"
                      className="p-1.5 rounded-lg bg-surface-800 border border-border text-text-secondary hover:text-error hover:border-error/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      <OfficerEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        officer={selectedOfficer}
      />
    </div>
  );
}
