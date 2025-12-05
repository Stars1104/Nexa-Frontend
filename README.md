# Nexa Frontend

Modern React application built with TypeScript, Vite, and Tailwind CSS for the Nexa platform. Provides user interfaces for Creators, Brands, Admins, and Students.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Nexa Frontend is a single-page application (SPA) built with React 18 and TypeScript. It provides different interfaces based on user roles:
- **Creators**: Dashboard, portfolio, campaign applications, chat, balance management
- **Brands**: Campaign creation, creator search, chat, contract management
- **Admins**: User management, campaign approval, analytics, guide management
- **Students**: Student verification, limited creator features

## ✨ Features

### Core Features
- **Authentication**
  - Email/password login
  - Google OAuth integration
  - Password reset
  - Student verification
  - Account restoration

- **Campaign Management**
  - Browse and filter campaigns
  - Apply to campaigns
  - Create campaigns (Brands)
  - Campaign timeline tracking
  - Bid management

- **Real-time Chat**
  - Socket.IO integration
  - Message history
  - Typing indicators
  - File attachments
  - Read receipts

- **Payment Integration**
  - Stripe payment processing
  - Subscription management
  - Payment method management
  - Transaction history
  - Withdrawal requests

- **Portfolio Management** (Creators)
  - Upload media
  - Reorder items
  - Statistics tracking

- **Admin Dashboard**
  - User management
  - Campaign approval
  - Analytics and metrics
  - Guide management
  - Student verification

- **Additional Features**
  - Dark mode support
  - Responsive design
  - Real-time notifications
  - SEO optimization
  - Error boundaries
  - Session management

## 🛠️ Tech Stack

- **React** 18.2 - UI library
- **TypeScript** 5.2 - Type safety
- **Vite** 5.0 - Build tool and dev server
- **Redux Toolkit** 2.0 - State management
- **React Router** 6.20 - Routing
- **Tailwind CSS** 3.3 - Styling
- **shadcn/ui** - UI component library
- **Socket.IO Client** 4.7 - Real-time communication
- **Stripe.js** 8.1 - Payment processing
- **React Hook Form** 7.61 - Form management
- **Zod** 4.0 - Schema validation
- **Axios** 1.10 - HTTP client
- **TanStack Query** 5.83 - Data fetching

## 📦 Requirements

- **Node.js** >= 18.x
- **npm** >= 9.x or **yarn** or **pnpm**

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** (see Configuration section)

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8000

# Socket.IO Server URL
VITE_SOCKET_URL=http://localhost:3001

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

## 💻 Development

### Project Structure

```
src/
├── api/                   # API client functions
│   ├── admin/            # Admin API endpoints
│   ├── auth/             # Authentication endpoints
│   ├── campaign/         # Campaign endpoints
│   └── ...
├── components/           # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin components
│   ├── brand/            # Brand components
│   ├── creator/          # Creator components
│   └── ...
├── pages/                # Page components
│   ├── admin/            # Admin pages
│   ├── brand/            # Brand pages
│   ├── creator/          # Creator pages
│   └── auth/             # Authentication pages
├── store/                # Redux store
│   ├── slices/           # Redux slices
│   └── thunks/           # Async thunks
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── contexts/             # React contexts
└── services/             # Service modules
```

### Key Directories

- **`src/api/`** - API client functions organized by feature
- **`src/components/`** - Reusable UI components
- **`src/pages/`** - Page-level components
- **`src/store/`** - Redux state management
- **`src/hooks/`** - Custom React hooks for shared logic
- **`src/utils/`** - Helper functions and utilities

### Code Style

- Use TypeScript for all new files
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations
- Use Redux for global state management
- Use React Query for server state

## 👥 User Roles

### Creator
- Dashboard with campaign opportunities
- Portfolio management
- Campaign applications
- Chat with brands
- Balance and withdrawals
- Subscription management
- Payment methods

### Brand
- Campaign creation and management
- Creator search and connections
- Chat with creators
- Contract management
- Payment processing
- Campaign analytics

### Admin
- Dashboard with metrics
- User management (Creators, Brands, Students)
- Campaign approval/rejection
- Guide management
- Brand rankings
- Withdrawal verification
- Student verification requests

### Student
- Student verification
- Limited creator features
## 🏗️ Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **The build output will be in the `dist/` directory**

3. **Deploy the `dist/` directory to your web server**

### Production Checklist

- [ ] Set `VITE_BACKEND_URL` to production API URL
- [ ] Set `VITE_SOCKET_URL` to production Socket.IO URL
- [ ] Use production Stripe keys
- [ ] Enable HTTPS
- [ ] Configure CORS on backend
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Optimize images and assets
- [ ] Test all user flows

### Deployment Options

- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **Traditional Web Server**: Nginx, Apache
- **CDN**: Cloudflare, AWS CloudFront

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **Build errors:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript errors:**
   ```bash
   npm run lint
   ```

3. **API connection issues:**
   - Verify `VITE_BACKEND_URL` is correct
   - Check CORS configuration on backend
   - Verify backend is running

4. **Socket.IO connection issues:**
   - Verify `VITE_SOCKET_URL` is correct
   - Check Socket.IO server is running
   - Verify CORS configuration

5. **Stripe payment issues:**
   - Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
   - Check Stripe keys match backend configuration
   - Verify Stripe webhook is configured

### Development Tips

- Use React DevTools for debugging
- Use Redux DevTools for state inspection
- Check browser console for errors
- Use Network tab to debug API calls
- Enable source maps in production for debugging

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible component primitives
- **Dark mode** support via ThemeProvider
- **Custom CSS** in `src/index.css`

## 🔐 Security

- All API calls include authentication tokens
- Sensitive data is not stored in localStorage
- XSS protection via React's built-in escaping
- CSRF protection via SameSite cookies
- Input validation on all forms

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Note:** Make sure the backend API and Socket.IO server are running before starting the frontend development server.
