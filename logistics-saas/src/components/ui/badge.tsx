'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-cyan-500/20 text-cyan-400',
        secondary:
          'border-transparent bg-gray-700 text-gray-300',
        success:
          'border-transparent bg-emerald-500/20 text-emerald-400',
        destructive:
          'border-transparent bg-red-500/20 text-red-400',
        warning:
          'border-transparent bg-amber-500/20 text-amber-400',
        outline:
          'text-gray-300 border-gray-600',
        new:
          'border-transparent bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 animate-pulse',
        accepted:
          'border-transparent bg-emerald-500/20 text-emerald-400',
        denied:
          'border-transparent bg-red-500/20 text-red-400',
        pending:
          'border-transparent bg-amber-500/20 text-amber-400',
        expired:
          'border-transparent bg-gray-500/20 text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
