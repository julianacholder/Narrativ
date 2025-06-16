

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getCategoryColor, getCategoryLabel } from "@/lib/categories";

interface CategoryBadgeProps {
  category: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  variant = "secondary",
  size = "default",
  showLabel = true,
  className = ""
}) => {
  const colorClasses = getCategoryColor(category);
  const label = showLabel ? getCategoryLabel(category) : category;

  return (
    <Badge 
      variant={variant}
      className={`${colorClasses} ${className}`}
    >
      {label}
    </Badge>
  );
};



