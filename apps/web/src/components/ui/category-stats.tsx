

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";

interface CategoryStatsProps {
  posts: Array<{ category: string }>;
  title?: string;
  description?: string;
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({
  posts,
  title = "Posts by Category",
  description = "Distribution of your content"
}) => {
  const categoryStats = posts.reduce((acc, post) => {
    const existing = acc.find(item => item.category === post.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ category: post.category, count: 1 });
    }
    return acc;
  }, [] as { category: string; count: number; }[]);

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categoryStats.length > 0 ? categoryStats.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <CategoryBadge category={category.category} />
              <span className="text-sm font-medium">{category.count} posts</span>
            </div>
          )) : (
            <p className="text-sm text-slate-500 text-center py-4">No categories yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};