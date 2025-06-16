

export interface CategoryConfig {
  value: string;
  label: string;
  color: string;
  description?: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { 
    value: "tech", 
    label: "Technology", 
    color: "bg-blue-100 text-blue-800",
    description: "Programming, AI, software development"
  },
  { 
    value: "lifestyle", 
    label: "Lifestyle", 
    color: "bg-pink-100 text-pink-800",
    description: "Health, wellness, daily life"
  },
  { 
    value: "work", 
    label: "Work", 
    color: "bg-purple-100 text-purple-800",
    description: "Career, productivity, business"
  },
  { 
    value: "travel", 
    label: "Travel", 
    color: "bg-green-100 text-green-800",
    description: "Adventures, destinations, culture"
  },
  { 
    value: "food", 
    label: "Food", 
    color: "bg-orange-100 text-orange-800",
    description: "Recipes, restaurants, cooking"
  },
  { 
    value: "personal", 
    label: "Personal", 
    color: "bg-gray-100 text-gray-800",
    description: "Thoughts, experiences, reflections"
  }
];

// Utility functions
export const getCategoryConfig = (category: string): CategoryConfig | undefined => {
  return CATEGORIES.find(cat => 
    cat.value === category.toLowerCase() || 
    cat.label.toLowerCase() === category.toLowerCase()
  );
};

export const getCategoryColor = (category: string): string => {
  const config = getCategoryConfig(category);
  return config?.color || "bg-gray-100 text-gray-800";
};

export const getCategoryLabel = (category: string): string => {
  const config = getCategoryConfig(category);
  return config?.label || category;
};

export const getCategoryDescription = (category: string): string => {
  const config = getCategoryConfig(category);
  return config?.description || "";
};

// Custom hook for category operations
export const useCategories = () => {
  return {
    categories: CATEGORIES,
    getCategoryConfig,
    getCategoryColor,
    getCategoryLabel,
    getCategoryDescription,
  };
};

