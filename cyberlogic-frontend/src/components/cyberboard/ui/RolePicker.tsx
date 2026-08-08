import React from "react";
import { Check } from "lucide-react";
import { AVAILABLE_ROLES } from "../shared/cyberboardConstants";

interface RolePickerProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

export const RolePicker: React.FC<RolePickerProps> = ({ selectedRoles, onChange }) => {
  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      onChange(selectedRoles.filter((r) => r !== roleId));
    } else {
      onChange([...selectedRoles, roleId]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {AVAILABLE_ROLES.map((role) => {
        const isSelected = selectedRoles.includes(role.id);
        return (
          <button
            type="button"
            key={role.id}
            onClick={() => toggleRole(role.id)}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              isSelected
                ? "bg-primary/10 border-primary text-primary shadow-xs"
                : "bg-surface-800/80 border-border/60 text-text-secondary hover:border-border"
            }`}
          >
            <span>{role.label}</span>
            {isSelected && <Check className="w-4 h-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
};

export default RolePicker;
