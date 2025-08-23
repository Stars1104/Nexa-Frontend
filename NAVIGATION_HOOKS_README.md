# Navigation Hooks for Nexa Frontend

This document explains how to use the new navigation hooks that solve the browser back button issue in the Nexa application.

## Problem Solved

Previously, when users navigated between components using the `setComponent` function, the browser's back button would not work correctly because:

1. Component changes were not reflected in the URL
2. Browser history was not updated with component state changes
3. Pressing back would go to the last actual URL change (often the home page)
4. Component state was lost during navigation

## Solution

The new navigation hooks provide URL-based component navigation that:

1. **Syncs component state with URL parameters** - Each component change updates the URL
2. **Handles browser back/forward navigation** - Listens to `popstate` events
3. **Maintains component state** - Preserves all component data in the URL
4. **Works with existing component system** - Minimal changes to existing code

## Available Hooks

### 1. `useComponentNavigation` - Simple Components

For basic string-based component navigation (e.g., "Painel", "Minha Conta").

```typescript
import { useComponentNavigation } from "../hooks/useComponentNavigation";

const { component, setComponent } = useComponentNavigation({
  defaultComponent: "Painel",
});

// Usage
setComponent("Minha Conta");
```

### 2. `useAdvancedComponentNavigation` - Complex Components

For components that need additional data (e.g., Chat with campaign ID and creator ID).

```typescript
import { useAdvancedComponentNavigation } from "../hooks/useAdvancedComponentNavigation";

const { component, setComponent } = useAdvancedComponentNavigation({
  defaultComponent: "Minhas campanhas",
});

// Usage with complex objects
setComponent({
  name: "Chat",
  campaign: { id: 123 },
  creatorId: "456",
});
```

## How It Works

### URL Structure

The hooks automatically create URLs like:

```
/creator?component=Painel
/creator?component=Detalhes do Projeto&projectId=123
/brand?component=Chat&campaignId=123&creatorId=456
```

### Browser History Management

1. **Component Change**: When `setComponent` is called, the URL is updated with `navigate(url, { replace: true })`
2. **Back Button**: The hook listens to `popstate` events and restores component state from URL parameters
3. **State Persistence**: All component data is preserved in the URL, so refreshing the page maintains the current view

### Event Handling

- **`popstate`**: Handles browser back/forward button clicks
- **`useEffect`**: Syncs component state with URL changes
- **Error Handling**: Gracefully falls back to default component if URL parsing fails

## Implementation Examples

### Basic Dashboard (Creator/Admin)

```typescript
import { useComponentNavigation } from "../hooks/useComponentNavigation";

function CreatorDashboard() {
  const { component, setComponent } = useComponentNavigation({
    defaultComponent: "Painel",
  });

  return (
    <div>
      <Sidebar setComponent={setComponent} component={component} />
      <main>
        {component === "Painel" && <Dashboard />}
        {component === "Minha Conta" && <Profile />}
        {/* ... other components */}
      </main>
    </div>
  );
}
```

### Complex Dashboard (Brand)

```typescript
import { useAdvancedComponentNavigation } from "../hooks/useAdvancedComponentNavigation";

function BrandDashboard() {
  const { component, setComponent } = useAdvancedComponentNavigation({
    defaultComponent: "Minhas campanhas",
  });

  const handleChatNavigation = (campaignId: number, creatorId: string) => {
    setComponent({
      name: "Chat",
      campaign: { id: campaignId },
      creatorId: creatorId,
    });
  };

  return (
    <div>
      <Sidebar setComponent={setComponent} component={component} />
      <main>
        {typeof component === "string"
          ? // Handle string components
            component === "Minhas campanhas" && <Campaigns />
          : // Handle complex components
            component.name === "Chat" && (
              <ChatPage
                campaignId={component.campaign?.id}
                creatorId={component.creatorId}
              />
            )}
      </main>
    </div>
  );
}
```

## Migration Guide

### Before (Old Way)

```typescript
const [component, setComponent] = useState("Painel");

// This would not update the URL or handle browser back button
setComponent("Minha Conta");
```

### After (New Way)

```typescript
const { component, setComponent } = useComponentNavigation({
  defaultComponent: "Painel",
});

// This automatically updates the URL and handles browser back button
setComponent("Minha Conta");
```

## Benefits

1. **Browser Back Button Works**: Users can navigate back to previous components
2. **Bookmarkable URLs**: Users can bookmark specific component states
3. **Shareable Links**: URLs can be shared with component state preserved
4. **Better UX**: Familiar browser navigation behavior
5. **State Persistence**: Component state survives page refreshes
6. **SEO Friendly**: Each component state has a unique URL

## Best Practices

1. **Use `useComponentNavigation`** for simple string-based components
2. **Use `useAdvancedComponentNavigation`** for components with additional data
3. **Always provide a `defaultComponent`** as fallback
4. **Test browser back/forward navigation** after implementation
5. **Handle URL parsing errors gracefully** (the hooks do this automatically)

## Troubleshooting

### Component Not Updating

- Check that you're using the `setComponent` from the hook, not a local state setter
- Verify the component name matches exactly (case-sensitive)
- Check browser console for any errors

### URL Not Updating

- Ensure the component is wrapped in a `Router` component
- Check that `useNavigate` and `useLocation` are available
- Verify the component is mounted within the router context

### Browser Back Button Not Working

- Check that `popstate` event listener is properly set up
- Verify URL parameters are being parsed correctly
- Ensure component state is being restored from URL parameters

## Future Enhancements

- **Deep linking support** for nested component hierarchies
- **Component transition animations** during navigation
- **URL validation** and sanitization
- **Custom URL schemes** for complex component states
- **Analytics integration** for component navigation tracking
