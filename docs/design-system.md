# Wild Trails - UI Design System

## Theme Implementation Summary

This document describes the new design system implemented for Wild Trails, following the provided mockup design.

### Design Tokens

#### Colors
- **Primary Brand**: `#13ec13` (vibrant green)
  - Primary Dark: `#0fb80f`
  - Primary Light: `#4bff4b`
- **Background**:
  - Light: `#f6f8f6`
  - Dark: `#102210`
- **Surface**:
  - Light: `#ffffff`
  - Dark: `#1a2c1a`
  - Dark Elevated: `#283928`

#### Typography
- **Display Font**: Be Vietnam Pro (headings, important text)
  - Weights: 400, 500, 700, 900
- **Body Font**: Noto Sans (body text, UI elements)
  - Weights: 400, 500, 700

#### Icons
- Material Symbols Outlined
- Accessible via the `<Icon>` component

### Core Components

#### Button (`/app/components/ui/Button.tsx`)
Fully accessible button component with variants:
- **primary**: Vibrant green background, dark text
- **secondary**: Border style with hover effects
- **ghost**: Transparent with hover state
- **outline**: White border, transparent background

Sizes: `sm`, `md`, `lg`

#### Input (`/app/components/ui/Input.tsx`)
Form input with:
- Label support
- Error state handling
- Focus ring animation
- Full width by default

#### GlassPanel (`/app/components/ui/GlassPanel.tsx`)
Glassmorphism effect container:
- Dark variant (default): Semi-transparent dark with backdrop blur
- Light variant: Semi-transparent light

#### Icon (`/app/components/ui/Icon.tsx`)
Material Symbols wrapper:
- Sizes: `sm`, `md`, `lg`, `xl`
- Fill option for solid icons

#### Skeleton (`/app/components/ui/Skeleton.tsx`)
Loading state components:
- text, rectangular, circular variants
- `GameCardSkeleton` for consistent loading states

#### Toast (`/app/components/ui/Toast.tsx`)
Notification system:
- Types: success, error, warning, info
- Auto-dismiss with configurable duration
- Accessible via `useToast()` hook

### Updated Pages

1. **Login/Welcome** (`/app/login/page.tsx`)
   - Follows exact mockup design
   - Hero section with benefits
   - Glass panel auth form
   - Social login buttons
   - Fully responsive

2. **Home** (`/app/page.tsx`)
   - Glass panel central card
   - Action cards for Create/Join game
   - Gradient background with pattern
   - Icon-based navigation

3. **Games List** (`/app/games/page.tsx`)
   - Glass panel game cards
   - Status badges with color coding
   - Filter system
   - Action buttons

4. **Game Creation** (`/app/game/create/page.tsx`)
   - Chat/Form mode toggle
   - Step progress indicator
   - Form components using new Input/Button
   - Enhanced validation

### Accessibility Features

- ✅ Keyboard navigation support
- ✅ Focus visible states on all interactive elements
- ✅ ARIA labels where appropriate
- ✅ Semantic HTML structure
- ✅ Screen reader friendly
- ✅ Color contrast meets WCAG AA standards

### Mobile Responsive Design

All components are mobile-first and responsive:
- Touch-friendly target sizes (min 44x44px)
- Collapsible navigation
- Adaptive layouts (flexbox/grid)
- Breakpoints: sm (640px), md (768px), lg (1024px)

### Animations

Smooth transitions throughout:
- `animate-fade-in`: Fade in effect
- `animate-fade-in-up`: Fade + slide up
- `animate-slide-up`: Slide up effect
- `animate-scale-in`: Scale in effect
- Glass panel hover effects
- Button press feedback

### Usage Examples

```tsx
import { Button, Icon, GlassPanel, Input, useToast } from "@/app/components/ui";

// Button
<Button variant="primary" size="lg">
  <Icon name="add" className="mr-2" />
  Create Game
</Button>

// Glass Panel
<GlassPanel className="p-6">
  <h2>Content</h2>
</GlassPanel>

// Input
<Input
  label="Game Name"
  placeholder="Enter name"
  value={value}
  onChange={handleChange}
/>

// Toast Notification
const { showToast } = useToast();
showToast("success", "Game created successfully!");
```

### Next Steps

Future enhancements to consider:
1. Profile page redesign
2. Onboarding flow polish
3. Game play screens update
4. Results/analytics visualization
5. Dark/light mode toggle
6. Additional toast animation options
7. Advanced form validation components

---

**Note**: This design system is extensible. Add new variants and components as needed while maintaining consistency with the established patterns.
