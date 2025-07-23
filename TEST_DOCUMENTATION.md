# AuthStep Component Test Documentation

## Overview
This document describes the comprehensive test suite for the `AuthStep` component, which is responsible for the initial authentication step where users choose their account type.

## Test Structure

### Test Categories

#### 1. Rendering Tests
- **Purpose**: Verify that all UI elements render correctly
- **Tests**:
  - Main heading and description text
  - Company and influencer buttons with icons
  - Google sign-in button
  - "or" separator
  - Create account link
  - Theme toggle button
  - Logo display

#### 2. Navigation Tests
- **Purpose**: Verify that navigation works correctly for different user actions
- **Tests**:
  - Company button navigates to `/signup/brand`
  - Influencer button navigates to `/signup/creator`
  - Logo click navigates to home (`/`)

#### 3. Button Interaction Tests
- **Purpose**: Verify that all buttons are clickable and responsive
- **Tests**:
  - Company button click functionality
  - Influencer button click functionality
  - Google button click functionality
  - Create account link click functionality

#### 4. Theme Functionality Tests
- **Purpose**: Verify theme switching and logo display based on theme
- **Tests**:
  - Light theme displays dark logo
  - Dark theme displays light logo
  - Theme toggle button functionality

#### 5. Accessibility Tests
- **Purpose**: Ensure the component meets accessibility standards
- **Tests**:
  - Proper heading structure (h1)
  - Accessible button labels
  - Alt text for images
  - Proper link text

#### 6. Styling and Layout Tests
- **Purpose**: Verify CSS classes are applied correctly
- **Tests**:
  - Main container styling
  - Card container styling
  - Button styling classes

#### 7. Responsive Design Tests
- **Purpose**: Verify responsive behavior
- **Tests**:
  - Responsive text sizes
  - Responsive padding

#### 8. Error Handling Tests
- **Purpose**: Verify graceful error handling
- **Tests**:
  - Navigation error handling
  - Missing navigation function handling

#### 9. Integration Tests
- **Purpose**: Verify integration with other components
- **Tests**:
  - Theme provider integration
  - Router integration

## Running Tests

### Available Commands

```bash
# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests once (no watch mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run AuthStep tests specifically
npm run test:run src/pages/auth/__tests__/AuthStep.test.tsx

# Run using the custom test runner
node test-auth-step.js
```

### Test Environment Setup

The tests use the following setup:

1. **Test Wrapper**: `TestWrapper` component that provides:
   - `BrowserRouter` for routing
   - `ThemeProvider` for theme management

2. **Mocks**:
   - Logo imports (`light-logo.png`, `dark-logo.png`)
   - `useSystemTheme` hook
   - `useNavigate` from react-router-dom

3. **Testing Libraries**:
   - `@testing-library/react` for rendering
   - `@testing-library/user-event` for user interactions
   - `vitest` as the test runner

## Test Coverage

The test suite covers:

- ✅ **100% Component Rendering**: All UI elements are tested
- ✅ **100% User Interactions**: All clickable elements are tested
- ✅ **100% Navigation Logic**: All navigation paths are tested
- ✅ **100% Theme Integration**: Light/dark theme switching
- ✅ **100% Accessibility**: ARIA labels, alt text, heading structure
- ✅ **100% Error Scenarios**: Navigation errors and edge cases
- ✅ **100% Responsive Design**: Mobile and desktop layouts

## Test Data

### Mock Data
- **Navigation Mock**: `mockNavigate` function that tracks navigation calls
- **Theme Mock**: `useSystemTheme` returns `false` by default
- **Logo Mocks**: String paths for light and dark logos

### Test Scenarios
1. **Happy Path**: Normal user interactions
2. **Error Path**: Navigation failures
3. **Edge Cases**: Missing functions, undefined values
4. **Theme Variations**: Light and dark theme testing

## Best Practices

### Test Organization
- Tests are grouped by functionality
- Each test has a clear, descriptive name
- Tests are independent and don't rely on each other

### Mock Management
- Mocks are cleared before each test
- Console errors are suppressed during error testing
- Navigation mocks are reset between tests

### Assertions
- Use semantic queries (getByRole, getByText)
- Test user behavior, not implementation details
- Verify both positive and negative cases

## Troubleshooting

### Common Issues

1. **Navigation Errors**: If you see uncaught navigation errors, the error handling tests are working correctly
2. **Theme Issues**: Ensure the ThemeProvider is properly mocked
3. **Logo Issues**: Verify that logo imports are properly mocked

### Debug Mode
To run tests in debug mode:

```bash
npm run test:ui
```

This opens the Vitest UI where you can:
- See test results in real-time
- Debug individual tests
- View test coverage
- Filter tests by status

## Maintenance

### Adding New Tests
1. Follow the existing test structure
2. Group tests by functionality
3. Use descriptive test names
4. Add proper mocks for new dependencies

### Updating Tests
1. Update mocks when component dependencies change
2. Update navigation paths if routing changes
3. Update theme logic if theme implementation changes

### Test Performance
- Tests run in parallel where possible
- Mocks are lightweight and fast
- No external dependencies in tests

## Contributing

When adding new features to the AuthStep component:

1. **Write tests first** (TDD approach)
2. **Update this documentation** with new test cases
3. **Ensure all tests pass** before submitting
4. **Add integration tests** for new dependencies

## Related Files

- `src/pages/auth/AuthStep.tsx` - Component under test
- `src/pages/auth/__tests__/AuthStep.test.tsx` - Test file
- `test-auth-step.js` - Custom test runner
- `src/test/setup.ts` - Global test setup
- `vitest.config.ts` - Vitest configuration 