# GestionPro - Business Management Application

## Overview

GestionPro is a comprehensive business management application built with React, Express, and PostgreSQL. It provides a complete solution for managing clients, products, categories, invoices, and sales with a modern, responsive interface using shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with proper error handling

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Connection Pooling**: Neon serverless pool with WebSocket support

## Key Components

### Authentication System
- **Provider**: Local Authentication (Email/Password)
- **Session Storage**: In-memory sessions with express-session
- **User Management**: Local user registration and profile management
- **Security**: Bcrypt password hashing, HTTP-only cookies, secure sessions
- **Features**: User registration, login/logout, profile completion

### Data Models
- **Users**: Profile information and authentication data
- **Clients**: Customer management with contact details
- **Categories**: Product categorization system
- **Products**: Inventory management with pricing and stock
- **Invoices**: Invoice generation with line items
- **Sales**: Sales history and analytics

### UI Architecture
- **Design System**: Consistent shadcn/ui components
- **Layout**: Sidebar navigation with responsive design
- **Forms**: React Hook Form with Zod validation
- **State**: Optimistic updates with React Query
- **Notifications**: Toast notifications for user feedback

## Data Flow

### Client-Server Communication
1. **Authentication Flow**: Replit OAuth → Session creation → User provisioning
2. **API Requests**: Authenticated requests with credential inclusion
3. **Data Fetching**: React Query manages caching and synchronization
4. **Form Submissions**: Optimistic updates with rollback on errors

### Database Operations
1. **Queries**: Drizzle ORM with type-safe operations
2. **Transactions**: Atomic operations for complex business logic
3. **Validation**: Zod schemas for runtime type checking
4. **Relationships**: Foreign key constraints and joins

## External Dependencies

### Core Technologies
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Auth service
- **UI Library**: Radix UI primitives
- **Styling**: Tailwind CSS framework
- **Validation**: Zod for schema validation

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across the stack
- **Linting**: ESLint configuration
- **Development**: Hot module replacement and error overlay

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild creates a single Node.js bundle
- **Assets**: Static files served from dist/public
- **Environment**: Production environment variables

### Development Environment
- **Local**: Concurrent frontend and backend development
- **Database**: Provisioned PostgreSQL instance
- **Authentication**: Replit development environment
- **Hot Reload**: Vite HMR for instant feedback

### Key Features
- **Dashboard**: Real-time business metrics and analytics
- **Client Management**: Complete customer relationship management
- **Product Catalog**: Inventory with categories, pricing, and dynamic VAT rates
- **Invoice System**: Professional invoice generation with PDF export
- **Sales Tracking**: Historical sales data and reporting
- **Multi-Currency Support**: XOF (Franc CFA) and GHS (Cedi) with proper formatting
- **Multi-Language**: French and English interface with complete i18n system
- **Settings Management**: User preferences for currency and language
- **Export/Backup**: Data export functionality for business continuity

## Recent Changes (January 28, 2025)
- **Migration Complete**: Successfully migrated from Replit Agent to standard Replit environment
- **PDF Download Feature**: Implemented functional PDF generation for invoices using jsPDF and html2canvas
- **Database Setup**: PostgreSQL database provisioned and schema deployed successfully
- **Application Running**: Server started on port 5000 with all routes functional
- **Authentication Working**: Local authentication with user registration and profile completion
- **Full CRUD Operations**: All business entities (clients, products, categories, invoices) working properly
- **New Tax Logic Implementation**: TVA now calculated exclusively at invoice level instead of product level
- **Database Schema Restructuring**: Products store only `priceHT` (price excluding tax), removed tax fields from products
- **Dynamic Invoice VAT**: Invoices now support 6 configurable tax rates (3%, 5%, 10%, 15%, 18%, 21%) with proper calculation
- **Backend Validation Fixed**: Updated all validation schemas to work with new tax structure
- **Frontend Tax Calculator**: Added dynamic tax rate selector and real-time total calculation in invoice forms
- **Multi-Currency Support**: Maintained XOF and GHS currency formatting with new tax structure
- **Sales History Fix**: Fixed sales data display issue by implementing automatic sales creation when invoices are marked as "paid"
- **Invoice Detail Page**: Added complete invoice detail view with PDF preview and status management
- **Stock Management**: Implemented automatic stock deduction when invoices are paid, with protection against negative stock
- **Currency Display Fix**: Corrected dashboard invoice amounts to show proper currency formatting (XOF/GHS/EUR)
- **Data Integrity**: Fixed deletion cascade for invoices with associated sales records
- **Stock Management Verification**: Confirmed automatic stock deduction is working correctly across multiple test scenarios
- **Migration to Replit Completed**: Successfully migrated from Replit Agent to standard Replit environment (January 28, 2025)
- **Database Provisioning**: PostgreSQL database created and schema deployed automatically
- **Product Selection Fix**: Resolved invoice form product selection issue by replacing ProductCombobox with SimpleProductSelect component
- **Form Validation Enhancement**: Improved form field updates and validation triggers for invoice creation

The application follows modern web development best practices with a focus on type safety, user experience, and maintainable code architecture adapted for African markets.