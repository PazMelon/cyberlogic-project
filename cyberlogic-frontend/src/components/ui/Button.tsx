import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "admin" | "success" | "danger" | "ghost";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

export function Button({
  variant = "primary",
  isLoading = false,
  icon,
  iconPosition = "left",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20 text-white border border-transparent hover:-translate-y-0.5",
    secondary:
      "text-text-secondary border border-border hover:border-primary/30 hover:text-text-primary hover:bg-white/5",
    admin:
      "bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:shadow-amber-500/25 text-white border border-transparent hover:-translate-y-0.5",
    success:
      "bg-success/10 hover:bg-success/20 border border-success/30 text-success",
    danger:
      "bg-error/10 hover:bg-error/20 border border-error/30 text-error",
    ghost:
      "text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent",
  };

  const selectedStyle = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      className={`${baseStyle} ${selectedStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && icon && iconPosition === "left" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
      {!isLoading && icon && iconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}
