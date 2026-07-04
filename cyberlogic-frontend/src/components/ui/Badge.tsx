import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "xs" | "sm" | "md";
  uppercase?: boolean;
  children: React.ReactNode;
}

export function Badge({
  variant = "primary",
  size = "xs",
  uppercase = true,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const baseStyle = "inline-flex items-center gap-1 font-semibold rounded-full border";

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[10px] tracking-wider",
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
  };

  const variantStyles = {
    primary: "bg-primary/10 border-primary/20 text-primary",
    accent: "bg-accent/10 border-accent/20 text-accent",
    success: "bg-success/10 border-success/20 text-success",
    warning: "bg-warning/10 border-warning/20 text-warning",
    error: "bg-error/10 border-error/20 text-error",
    info: "bg-info/10 border-info/20 text-info",
    neutral: "bg-surface-800 border-border text-text-secondary",
  };

  const selectedSize = sizeStyles[size] || sizeStyles.xs;
  const selectedVariant = variantStyles[variant] || variantStyles.primary;
  const caseStyle = uppercase ? "uppercase" : "";

  return (
    <span
      className={`${baseStyle} ${selectedSize} ${selectedVariant} ${caseStyle} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
