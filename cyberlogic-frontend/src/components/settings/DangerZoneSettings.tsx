import { AlertTriangle, Trash2 } from "lucide-react";
import { useDialog } from "../../utils/useDialog";

export default function DangerZoneSettings() {
  const { showAlert, showConfirm } = useDialog();

  const handleDeactivate = async () => {
    const confirmed = await showConfirm({
      title: "Deactivate Account",
      message: "Are you absolutely sure you want to deactivate your Cyberlogic Portal account? This operation is irreversible.",
      type: "danger",
      confirmText: "Deactivate",
    });
    if (confirmed) {
      showAlert({
        title: "Request Submitted",
        message: "Account deactivation requested. Please coordinate with a Club Administrator to finalize deletion.",
        type: "info",
      });
    }
  };

  return (
    <div id="danger" className="glass rounded-2xl p-5 sm:p-6 border border-error/20 bg-error/5 space-y-4 scroll-mt-20">
      <h2 className="text-base font-bold text-error flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-error" /> Danger Zone
      </h2>
      <p className="text-xs text-text-muted leading-relaxed">
        Once you terminate your membership, all active event RSVPs, CTF leaderboard scores, and portal forum posts will be permanently unlinked or deleted.
      </p>
      <div className="pt-2">
        <button
          type="button"
          onClick={handleDeactivate}
          className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/90 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Deactivate Account
        </button>
      </div>
    </div>
  );
}
