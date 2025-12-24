# Class Name Management with `cn` Utility

## Overview

Wild Trails now uses `clsx` + `tailwind-merge` for cleaner, more robust class name management across all UI components.

## The `cn` Utility

Located at `/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## What It Does

1. **`clsx`**: Handles conditional classes elegantly
2. **`twMerge`**: Resolves Tailwind CSS class conflicts

## Benefits

### Before (String Concatenation):
```tsx
className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
```

**Problems:**
- Extra spaces with empty strings
- No Tailwind conflict resolution
- Hard to read with complex conditions

### After (cn utility):
```tsx
className={cn(
  baseStyles,
  variantStyles[variant],
  sizeStyles[size],
  fullWidth && "w-full",
  className
)}
```

**Benefits:**
- ✅ Clean, readable code
- ✅ Handles falsy values automatically
- ✅ Resolves Tailwind conflicts (e.g., user's `h-10` overrides component's `h-12`)
- ✅ No extra spaces

## Usage Examples

### Simple Concatenation
```tsx
cn("px-4 py-2", "rounded-lg") 
// → "px-4 py-2 rounded-lg"
```

### Conditional Classes
```tsx
cn("base-class", isActive && "active-class", "another-class")
// If isActive is true: "base-class active-class another-class"
// If isActive is false: "base-class another-class"
```

### Object Syntax
```tsx
cn({
  "text-red-500": hasError,
  "text-green-500": !hasError,
}, "font-bold")
```

### Tailwind Conflict Resolution
```tsx
// User provides h-10, component has h-12
cn("h-12 px-4", "h-10 bg-blue-500")
// → "px-4 h-10 bg-blue-500" (h-10 wins, h-12 is removed)
```

This is crucial for components that accept `className` props!

## Updated Components

All UI components now use `cn`:
- ✅ Button
- ✅ Input
- ✅ GlassPanel
- ✅ Icon
- ✅ Skeleton

## How to Use in New Components

```tsx
import { cn } from "@/lib/utils";

export const MyComponent = ({ className, ...props }) => {
  return (
    <div 
      className={cn(
        "base-styles",
        "more-styles",
        someCondition && "conditional-class",
        className // User's classes always come last
      )}
      {...props}
    />
  );
};
```

## Best Practices

1. **Import once**: `import { cn } from "@/lib/utils";`
2. **Base classes first**: Start with component's default styles
3. **Conditionals in between**: Add conditional classes
4. **User className last**: Always put user's `className` prop last so they can override
5. **Use objects for complex conditions**: `cn({ "class": condition })`

## Why This Matters

When users of your components pass custom classes:

```tsx
// Without cn (tailwind-merge):
<Button className="h-10">Click</Button>
// Classes: "h-12 px-5 text-base h-10"
// Result: Both h-12 AND h-10 applied → unpredictable behavior

// With cn (tailwind-merge):
<Button className="h-10">Click</Button>
// Classes: "px-5 text-base h-10"
// Result: Only h-10 applied → user's class wins ✓
```

## Dependencies

```json
{
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

## References

- [clsx on npm](https://www.npmjs.com/package/clsx)
- [tailwind-merge on npm](https://www.npmjs.com/package/tailwind-merge)
- Used by: shadcn/ui, Radix UI, and many other popular React libraries

---

**Pro Tip**: The `cn` utility is also re-exported from `/app/components/ui/index.ts` for convenience!
