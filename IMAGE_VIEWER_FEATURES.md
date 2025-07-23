# Image Viewer and Download Features

## Overview

The Chat component now includes enhanced image viewing and download functionality with a full-screen image viewer and improved download capabilities.

## Features

### Image Viewer

- **Full-screen viewing**: Click on any image in chat to open it in a full-screen viewer
- **Zoom controls**: Zoom in/out with buttons or keyboard shortcuts (+ / -)
- **Rotation**: Rotate images 90° at a time with the rotate button or 'R' key
- **Reset**: Reset zoom and rotation to default with the reset button or '0' key
- **Download**: Download images directly from the viewer with the download button or 'D' key
- **Keyboard shortcuts**:
  - `+` or `=` - Zoom in
  - `-` - Zoom out
  - `R` - Rotate
  - `0` - Reset
  - `D` - Download
  - `ESC` - Close viewer

### Image Actions in Chat

- **Quick actions**: Hover over images to see quick action buttons
  - View full size (opens image viewer)
  - Download image
- **File dropdown**: Right-click or use the dropdown menu for additional options
  - View image (opens image viewer for images, new tab for other files)
  - Download image/file

### Enhanced Download

- **Canvas-based download**: Images are downloaded using canvas to preserve quality
- **Cross-origin support**: Handles images from different domains
- **Error handling**: Multiple fallback methods for reliable downloads
- **Progress tracking**: Visual feedback during download process

### UI Improvements

- **Image previews**: File dropdown shows image thumbnails for image files
- **Context-aware actions**: Different icons and text for images vs other files
- **Responsive design**: Works on both desktop and mobile devices
- **Dark mode support**: Full dark mode compatibility

## Technical Implementation

### Image Viewer Component

- Uses React Portal for full-screen overlay
- Manages zoom and rotation state
- Handles keyboard events
- Prevents body scroll when open

### Download Functions

- `downloadImageToLocal()`: Enhanced image download using canvas
- `downloadFileToLocal()`: General file download with fallbacks
- Cross-origin image handling
- Blob URL management

### State Management

- `imageViewer`: Controls viewer visibility and image data
- `imageZoom`: Current zoom level (0.25x to 3x)
- `imageRotation`: Current rotation angle (0°, 90°, 180°, 270°)

## Usage Examples

### Opening an Image

```typescript
// Click on image in chat
// Or use file dropdown → "View Image"
// Or use quick action button on hover
```

### Downloading an Image

```typescript
// From image viewer: Click download button or press 'D'
// From chat: Use quick action button or file dropdown
// From file dropdown: Click "Download Image"
```

### Keyboard Navigation

```typescript
// In image viewer:
// + / = : Zoom in
// - : Zoom out
// R : Rotate
// 0 : Reset
// D : Download
// ESC : Close
```

## Browser Compatibility

- Modern browsers with canvas support
- Cross-origin image handling
- File download API support
- Keyboard event handling

## Error Handling

- Network errors during download
- Canvas context creation failures
- Image loading failures
- Cross-origin restrictions
- File size limitations
