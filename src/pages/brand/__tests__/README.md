# Brand Index Tests

This directory contains comprehensive tests for the Brand Index page (`src/pages/brand/Index.tsx`).

## Test Coverage

The test suite covers the following areas:

### 🎯 Rendering Tests
- **Main Layout Structure**: Verifies that all core components render correctly
- **CSS Classes**: Ensures proper styling classes are applied for desktop and mobile layouts
- **Container Structure**: Validates the overall page structure and layout

### 🔄 Component Switching Tests
- **Default State**: Confirms BrandDashboard renders by default
- **Navigation**: Tests switching between different components:
  - `my campaigns` → BrandDashboard
  - `my account` → BrandProfile
  - Unknown components → NotFound
- **State Management**: Verifies component state is maintained during switches
- **Rapid Switching**: Tests handling of multiple rapid component changes

### 📱 Mobile Responsiveness Tests
- **Desktop Layout**: Tests desktop-specific styling and behavior
- **Mobile Layout**: Tests mobile-specific styling (padding, layout adjustments)
- **Responsive Behavior**: Verifies proper responsive design implementation

### ♿ Accessibility Tests
- **Semantic Structure**: Ensures proper HTML semantics
- **Focus Management**: Tests keyboard navigation and focus handling
- **Screen Reader Support**: Validates accessibility features

### 🛡️ Error Handling Tests
- **Unknown Components**: Tests graceful handling of unknown component types
- **Recovery**: Verifies the app can recover from error states
- **Fallback Behavior**: Ensures NotFound component displays appropriately

### 🔗 Integration Tests
- **ThemeProvider**: Tests integration with theme system
- **ComponentNavbar**: Verifies navbar integration
- **BrandSidebar**: Tests sidebar integration and communication

## Test Structure

```
src/pages/brand/__tests__/
├── Index.test.tsx          # Main test file
└── README.md              # This documentation
```

## Running Tests

### Run All Brand Index Tests
```bash
npm test src/pages/brand/__tests__/Index.test.tsx
```

### Run with Coverage
```bash
npm test src/pages/brand/__tests__/Index.test.tsx -- --coverage
```

### Run Specific Test Suite
```bash
# Run only rendering tests
npm test src/pages/brand/__tests__/Index.test.tsx -t "Rendering"

# Run only component switching tests
npm test src/pages/brand/__tests__/Index.test.tsx -t "Component Switching"
```

### Run with Watch Mode
```bash
npm test src/pages/brand/__tests__/Index.test.tsx -- --watch
```

## Test Dependencies

The tests use the following testing libraries and utilities:

- **Vitest**: Test runner and assertion library
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional DOM matchers

## Mocked Components

The following components are mocked to isolate the Brand Index component:

- `BrandSidebar`: Mocked with test buttons for component switching
- `BrandDashboard`: Mocked as a simple div with test ID
- `BrandProfile`: Mocked as a simple div with test ID
- `ComponentNavbar`: Mocked as a simple div with test ID
- `NotFound`: Mocked as a simple div with test ID

## Mocked Hooks

- `useIsMobile`: Mocked to control mobile/desktop behavior
- `useSystemTheme`: Mocked for theme testing

## Test Utilities

### TestWrapper Component
A wrapper component that provides:
- BrowserRouter for routing context
- ThemeProvider for theme context
- Proper test environment setup

### Mock Setup
- ResizeObserver and IntersectionObserver mocks for Radix UI components
- Logo asset mocks
- React Router mocks

## Expected Test Results

When all tests pass, you should see output similar to:

```
✓ Brand Index (8 tests)
  ✓ Rendering (4 tests)
  ✓ Component Switching (6 tests)
  ✓ Mobile Responsiveness (4 tests)
  ✓ State Management (2 tests)
  ✓ Accessibility (2 tests)
  ✓ Error Handling (2 tests)
  ✓ Integration (3 tests)

Test Files  1 passed (1)
Tests       23 passed (23)
```

## Troubleshooting

### Common Issues

1. **Mock Import Errors**: Ensure all mocked components exist and are properly exported
2. **Theme Provider Issues**: Check that ThemeProvider is properly configured
3. **Mobile Hook Issues**: Verify useIsMobile hook is properly mocked
4. **CSS Class Issues**: Ensure Tailwind classes are available in test environment

### Debug Mode

Run tests in debug mode for more detailed output:

```bash
npm test src/pages/brand/__tests__/Index.test.tsx -- --verbose
```

## Contributing

When adding new features to the Brand Index page:

1. **Add corresponding tests** for new functionality
2. **Update mocks** if new components are added
3. **Maintain test coverage** above 90%
4. **Follow existing patterns** for consistency

## Related Files

- `src/pages/brand/Index.tsx` - Main component under test
- `src/components/brand/BrandSidebar.tsx` - Sidebar component
- `src/components/brand/BrandDashboard.tsx` - Dashboard component
- `src/components/brand/BrandProfile.tsx` - Profile component
- `src/components/ComponentNavbar.tsx` - Navigation component
- `src/pages/NotFound.tsx` - Not found component 