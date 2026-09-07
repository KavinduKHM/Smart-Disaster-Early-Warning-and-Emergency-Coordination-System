# Smart Disaster Early Warning and Emergency Coordination System

Comprehensive Disaster Warning & Emergency Coordination platform built with **Angular** frontend and **NestJS** backend.

## Project Structure

```
disaster-warning-system/
├── client/          # Angular Frontend
│   └── src/app/
│       ├── core/    # Singleton services, guards, interceptors, models
│       ├── shared/  # Shared reusable components, directives, pipes
│       └── features/
│           ├── dashboard/   # DMC Dashboard
│           ├── uc1-warning/ # UC1: Issue & Broadcast Warning
│           ├── uc2-reports/ # UC2: Submit & Verify Reports
│           ├── uc3-rescue/  # UC3: Emergency Response & Rescue
│           └── uc4-relief/  # UC4: Relief & Shelters
└── server/          # NestJS Backend
    └── src/modules/
        ├── shared/
        ├── auth/
        ├── uc1-warning/
        ├── uc2-reports/
        ├── uc3-rescue/
        └── uc4-relief/
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn
- Docker & Docker Compose (optional)

### Installation
```bash
# Install Frontend
cd client
npm install

# Install Backend
cd ../server
npm install
```

### Running Locally
```bash
# Backend Server
cd server
npm run start:dev

# Frontend Client
cd client
npm start
```
