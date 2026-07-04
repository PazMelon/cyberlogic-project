import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "glass-light" | "filled" | "outline";
  hoverEffect?: boolean;
  glowColor?: "primary" | "accent" | "amber" | "none";
  children: React.ReactNode;
}

export function Card({
  variant = "glass",
  hoverEffect = false,
  glowColor = "none",
  children,
  className = "",
  ...props
}: CardProps) {
  const baseStyle = "rounded-2xl border transition-all duration-300 overflow-hidden";

  const variantStyles = {
    glass: "glass",
    "glass-light": "glass-light",
    filled: "bg-surface-900/50 border-border",
    outline: "bg-transparent border-border",
  };

  const glowStyles = {
    primary: "hover:shadow-[0_0_20px_var(--color-primary-glow)] hover:border-primary/20",
    accent: "hover:shadow-[0_0_20px_var(--color-accent-glow)] hover:border-accent/20",
    amber: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-500/20",
    none: "",
  };

  const hoverStyle = hoverEffect ? "hover:-translate-y-1 hover:border-primary/30" : "";
  const selectedStyle = variantStyles[variant] || variantStyles.glass;
  const selectedGlow = glowStyles[glowColor] || glowStyles.none;

  return (
    <div
      className={`${baseStyle} ${selectedStyle} ${selectedGlow} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
