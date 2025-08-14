# Nexa Platform Guide System

## Overview

The Nexa Platform Guide System provides comprehensive step-by-step guides for both brands and creators to maximize their success on the platform. The system is fully integrated with the backend API and accessible from multiple locations within the application.

## Features

### 1. Public Guide Access

- **Route**: `/guides`
- **Access**: Public (no authentication required)
- **Features**:
  - Tabbed interface for Brand and Creator guides
  - Step-by-step instructions with descriptions
  - Video support for each step (when available)
  - Responsive design for all devices
  - SEO optimized with structured data

### 2. Dashboard Integration

- **Brand Dashboard**: Accessible via "Guia da Plataforma" in the sidebar
- **Creator Dashboard**: Accessible via "Guia da Plataforma" in the sidebar
- **Component**: `GuideEmbedded` - optimized for dashboard integration

### 3. Navigation Integration

- **Main Navbar**: "Guia para" button links to `/guides`
- **Sidebar Navigation**: Added to both brand and creator sidebars

## Technical Implementation

### Backend API

- **Endpoint**: `GET /api/guides`
- **Response**: Paginated list of guides with steps
- **Data Structure**:
  ```json
  {
    "id": number,
    "title": string,
    "audience": "Brand" | "Creator",
    "description": string,
    "steps": [
      {
        "id": number,
        "title": string,
        "description": string,
        "video_path": string | null,
        "video_url": string | null,
        "order": number
      }
    ]
  }
  ```

### Frontend Components

- **`Guide.tsx`**: Full-page guide component with navbar and footer
- **`GuideEmbedded.tsx`**: Dashboard-embedded guide component
- **Video Support**: Play button overlay, error handling, fallback states

### Database Structure

- **Guides Table**: Stores guide metadata (title, audience, description)
- **Steps Table**: Stores individual steps with order and video support
- **Seeded Data**: Pre-populated with comprehensive guides for both audiences

## User Experience

### For Brands

1. **Campaign Objective Definition**: Learn how to set clear campaign goals
2. **Audience Targeting**: Understand creator compatibility and selection
3. **Budget Planning**: Set appropriate incentives and payment models
4. **Brief Creation**: Write clear creative briefs for creators
5. **Campaign Launch**: Track performance and manage post-launch activities

### For Creators

1. **Profile Optimization**: Highlight niche and audience statistics
2. **Campaign Brief Review**: Understand brand requirements and objectives
3. **Content Planning**: Create content strategies and timelines
4. **Content Creation**: Produce and submit content for review
5. **Publication & Reporting**: Share results and track performance

## Accessibility Features

- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard support for all interactions
- **High Contrast**: Compatible with high contrast themes
- **Responsive Design**: Works on all screen sizes and devices

## Future Enhancements

- **Interactive Tutorials**: Step-by-step walkthroughs
- **Progress Tracking**: Save user progress through guides
- **Video Content**: Enhanced video tutorials for each step
- **Localization**: Multi-language support
- **Analytics**: Track guide usage and effectiveness

## Usage Examples

### Accessing from Main Navigation

```typescript
// User clicks "Guia para" in main navbar
navigate("/guides");
```

### Accessing from Dashboard

```typescript
// User selects "Guia da Plataforma" from sidebar
setComponent("Guia da Plataforma");
```

### API Integration

```typescript
import { GetGuide } from "@/api/admin/guide";

const fetchGuides = async () => {
  const data = await GetGuide();
  setGuides(data.data || data);
};
```

## Error Handling

- **Loading States**: Spinner with descriptive text
- **Error States**: Clear error messages with retry options
- **Fallback Content**: Graceful degradation when videos unavailable
- **Network Issues**: Proper error handling for API failures

## Performance Considerations

- **Lazy Loading**: Components load only when needed
- **Optimized Images**: Proper aspect ratios and responsive images
- **Efficient API Calls**: Single API call for all guide data
- **Caching**: Browser caching for static assets

## Security

- **Public Access**: Guides are publicly accessible (no sensitive data)
- **Input Validation**: Backend validation for all guide content
- **XSS Protection**: Proper escaping of user-generated content
- **CORS Configuration**: Proper cross-origin resource sharing setup
