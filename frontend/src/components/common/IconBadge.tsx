import React from 'react';

export interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'danger' | 'warning' | 'success' | 'indigo';
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 rounded-lg text-lg',
    md: 'w-10 h-10 rounded-xl text-xl',
    lg: 'w-16 h-16 rounded-2xl text-3xl',
    xl: 'w-20 h-20 rounded-3xl text-4xl',
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const variantStyles = {
    default: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
    primary: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]',
    danger: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
    warning: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    success: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
    indigo: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]',
  };

  return (
    <div
      className={`inline-flex items-center justify-center transition-transform ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className={`material-symbols-outlined ${iconSizes[size]} leading-none`}>
        {icon}
      </span>
    </div>
  );
};
