# Light and Dark Mode System

## Overview

The Nexa application has a comprehensive light and dark mode system implemented using React Context, CSS custom properties, and Tailwind CSS. The system supports three theme modes: Light, Dark, and System (which automatically follows the user's system preference).

## Architecture

### 1. ThemeProvider (`src/components/ThemeProvider.tsx`)

The main theme context provider that manages theme state and provides theme switching functionality.

**Features:**

- Manages theme state (light/dark/system)
- Persists theme preference in localStorage
- Automatically applies theme classes to document root
- Provides theme context to all child components

**Usage:**

```tsx
<ThemeProvider defaultTheme="system" storageKey="nexa-ui-theme">
  <App />
</ThemeProvider>
```

### 2. ThemeToggle (`src/components/ThemeToggle.tsx`)

A dropdown component that allows users to switch between theme modes.

**Features:**

- Dropdown menu with Light/Dark/System options
- Animated sun/moon icons
- Accessible with proper ARIA labels
- Smooth transitions between themes

**Usage:**

```tsx
import { ThemeToggle } from "./ThemeToggle";

<ThemeToggle />;
```

### 3. useSystemTheme Hook (`src/hooks/use-system-theme.ts`)

A custom hook that detects and responds to system theme changes.

**Features:**

- Detects initial system theme preference
- Listens for system theme changes
- Returns boolean indicating if system is in dark mode

**Usage:**

```tsx
import { useSystemTheme } from "../hooks/use-system-theme";

const systemTheme = useSystemTheme();
const isDarkMode = systemTheme;
```

### 4. CSS Variables (`src/index.css`)

Comprehensive CSS custom properties for both light and dark themes.

**Light Theme Variables:**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}
```

**Dark Theme Variables:**

```css
.dark {
  --background: 0 0% 5.1%;
  --foreground: 210 40% 98%;
  --card: 0 0% 5.1%;
  --card-foreground: 210 40% 98%;
  --popover: 0 0% 5.1%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

## Implementation Details

### Theme-Aware Components

Most components in the application use theme-aware Tailwind classes:

- `bg-background` / `text-foreground` - Main background and text colors
- `bg-card` / `text-card-foreground` - Card backgrounds and text
- `bg-primary` / `text-primary-foreground` - Primary action colors
- `bg-secondary` / `text-secondary-foreground` - Secondary action colors
- `bg-muted` / `text-muted-foreground` - Muted/disabled colors
- `border-border` - Border colors

### Logo Switching

The application automatically switches between light and dark logos based on the current theme:

```tsx
const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);

{
  isDarkMode ? (
    <img src={LightLogo} alt="Logo" />
  ) : (
    <img src={DarkLogo} alt="Logo" />
  );
}
```

### Theme Toggle Placement

The ThemeToggle component is strategically placed in:

1. **Main Navbar** - For landing page and public areas
2. **ComponentNavbar** - For authenticated user areas (creator, brand, admin)
3. **Auth Pages** - For login, signup, and password reset pages
4. **Student Verification** - For the student verification page

## Usage Examples

### Using Theme in Components

```tsx
import { useTheme } from "./ThemeProvider";
import { useSystemTheme } from "../hooks/use-system-theme";

const MyComponent = () => {
  const { theme, setTheme } = useTheme();
  const systemTheme = useSystemTheme();

  const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);

  return (
    <div className="bg-background text-foreground">
      <h1 className="text-foreground">Hello World</h1>
      <p className="text-muted-foreground">This text adapts to theme</p>
      <button
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setTheme(isDarkMode ? "light" : "dark")}
      >
        Toggle Theme
      </button>
    </div>
  );
};
```

### Theme-Aware Styling

```tsx
// Good - Theme-aware
<div className="bg-background text-foreground border border-border">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// Avoid - Hardcoded colors
<div className="bg-white text-black dark:bg-gray-800 dark:text-white">
  <h2 className="text-black dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-300">Description</p>
</div>
```

## Best Practices

1. **Always use theme-aware classes** instead of hardcoded colors
2. **Test both themes** during development
3. **Use semantic color names** (background, foreground, primary, etc.)
4. **Avoid mixing hardcoded and theme-aware colors**
5. **Ensure proper contrast** in both light and dark modes

## Testing

The theme system includes comprehensive tests in `src/pages/auth/__tests__/AuthStep.test.tsx`:

- Logo switching based on theme
- Theme toggle functionality
- Accessibility features
- Theme persistence

## Browser Support

The theme system works in all modern browsers and includes:

- CSS custom properties support
- Media query support for system theme detection
- localStorage for theme persistence
- Smooth transitions and animations

## Performance

The theme system is optimized for performance:

- CSS variables for instant theme switching
- Minimal JavaScript overhead
- Efficient DOM manipulation
- No layout shifts during theme changes
