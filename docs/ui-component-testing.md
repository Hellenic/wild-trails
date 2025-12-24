# UI Component Testing Guide

The Wild Trails UI component library consists of reusable, accessible React components. Since the project uses Jest without React Testing Library, these components are best tested through integration tests and manual testing.

## Component Overview

### Button
**Location:** `/app/components/ui/Button.tsx`

**Variants:**
- `primary` - Vibrant green background (default)
- `secondary` - Border with transparent background
- `ghost` - Transparent with subtle hover
- `outline` - White border variant

**Sizes:** `sm`, `md` (default), `lg`

**Props:**
- `variant?: "primary" | "secondary" | "ghost" | "outline"`
- `size?: "sm" | "md" | "lg"`
- `fullWidth?: boolean`
- `disabled?: boolean`
- All standard button HTML attributes

**Accessibility:**
- Focus ring with primary color
- Disabled state styling
- forwardRef support

### Input
**Location:** `/app/components/ui/Input.tsx`

**Features:**
- Optional label
- Error message display
- Error state styling
- Full width by default

**Props:**
- `label?: string`
- `error?: string`
- `fullWidth?: boolean` (default: true)
- All standard input HTML attributes

**Accessibility:**
- Label association
- Error state announced
- Focus ring styling
- Disabled state support

### GlassPanel
**Location:** `/app/components/ui/GlassPanel.tsx`

**Variants:**
- `dark` - Semi-transparent dark (default)
- `light` - Semi-transparent light

**Features:**
- Backdrop blur effect
- Rounded corners
- Border glow

**Props:**
- `variant?: "dark" | "light"`
- All standard div HTML attributes

### Icon
**Location:** `/app/components/ui/Icon.tsx`

**Features:**
- Material Symbols wrapper
- Multiple sizes
- Fill option

**Props:**
- `name: string` - Material Symbol icon name
- `size?: "sm" | "md" | "lg" | "xl"`
- `fill?: boolean`
- All standard span HTML attributes

### Skeleton
**Location:** `/app/components/ui/Skeleton.tsx`

**Variants:**
- `text` - For text lines
- `rectangular` - For cards/blocks (default)
- `circular` - For avatars

**Props:**
- `variant?: "text" | "rectangular" | "circular"`
- `width?: string`
- `height?: string`
- All standard div HTML attributes

**Pre-made:**
- `GameCardSkeleton` - For game list loading states

### Toast
**Location:** `/app/components/ui/Toast.tsx`

**Usage:**
```tsx
import { useToast } from "@/app/components/ui/Toast";

function MyComponent() {
  const { showToast } = useToast();
  
  const handleSuccess = () => {
    showToast("success", "Operation completed!", 5000);
  };
}
```

**Types:** `success`, `error`, `warning`, `info`

**Features:**
- Auto-dismiss
- Manual close
- Slide-up animation
- Context provider pattern

## Manual Testing Checklist

### Button
- [ ] All variants render correctly
- [ ] All sizes work as expected
- [ ] Hover states trigger
- [ ] Focus ring visible on keyboard navigation
- [ ] Disabled state prevents interaction
- [ ] Click handlers fire
- [ ] Icons integrate properly

### Input
- [ ] Label displays when provided
- [ ] Error message shows and styles apply
- [ ] Focus ring appears
- [ ] Value updates on change
- [ ] Disabled state works
- [ ] Different input types supported

### GlassPanel
- [ ] Backdrop blur renders
- [ ] Dark variant styling
- [ ] Light variant styling
- [ ] Border glow on hover
- [ ] Content displays correctly

### Icon
- [ ] Icons render from Material Symbols
- [ ] Sizes apply correctly
- [ ] Custom className works
- [ ] Different icon names work

### Skeleton
- [ ] Pulse animation runs
- [ ] Variants style correctly
- [ ] Custom dimensions apply
- [ ] GameCardSkeleton displays structure

### Toast
- [ ] Notifications appear
- [ ] Auto-dismiss works
- [ ] Manual close works
- [ ] Different types style correctly
- [ ] Multiple toasts stack properly

## Integration Testing

These components are tested through:
1. **Visual testing** - Manual review in Storybook or application
2. **Integration tests** - Testing parent components that use these
3. **E2E tests** - Testing complete user flows

## Why No Unit Tests?

1. **Presentational components** - Primarily styling and structure
2. **No React Testing Library** - Project doesn't have RTL dependency
3. **Low complexity** - Simple prop-based rendering
4. **Better tested via integration** - Parent components provide context

## Adding Tests in the Future

If adding React Testing Library:

```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Then create proper render tests for:
- Prop variations
- User interactions
- Accessibility features
- Edge cases

## Accessibility Testing

Use these tools to verify components:
- **axe DevTools** - Browser extension for a11y auditing
- **Keyboard navigation** - Tab through all interactive elements
- **Screen reader** - Test with NVDA, JAWS, or VoiceOver
- **Color contrast** - Verify WCAG AA compliance

## Performance Testing

Monitor:
- **Re-render count** - Use React DevTools Profiler
- **Animation performance** - Check for 60fps
- **Bundle size** - Verify tree-shaking works
- **Load time** - Measure component initialization

---

**Note:** For production-critical components, consider adding dedicated integration or E2E tests rather than isolated unit tests.
