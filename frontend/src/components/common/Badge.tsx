import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'surface-high'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'secondary';
  size?: 'sm' | 'md';
  icon?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'surface-high',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    'surface-high': 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
    primary: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]',
    success: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
    info: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]',
    secondary: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-sm leading-none">{icon}</span>}
      {children}
    </span>
  );
};
