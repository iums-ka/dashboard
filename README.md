# IIIUS Foyer Dashboard

A web dashboard application designed for display in foyer environments, featuring real-time data integration and a responsive grid-based layout. Built with Laravel backend and React frontend.

![Laravel](https://img.shields.io/badge/Laravel-11.x-red) ![React](https://img.shields.io/badge/React-19.x-blue) ![PHP](https://img.shields.io/badge/PHP-8.2+-purple)

![screenshot](Screenshot.png)
## Features

### 📊 Dashboard Technical Features
- **Modular Grid Layout**: 16x9 responsive grid system for flexible component arrangement
- **Real-time Data Updates**: Automatic refresh intervals for live data display
- **Material-UI Design**: Clean, modern interface with consistent theming
- **RESTful API**: Clean API endpoints for all data operations
- **Service Architecture**: Modular service classes


### 🍽️ Mensa Integration
- **Daily Menu Display**: Fetches and displays current mensa (cafeteria) menus
- **Image Integration**: Automatic meal image fetching via Google Images API
- **Multi-day View**: Shows menus for upcoming days

### 📋 Antrags Management
- **Document Processing**: Supports CSV and Excel file formats
- **Nextcloud Integration**: Direct file access from Nextcloud storage
- **Status Tracking**: Real-time proposal status updates


## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 11.x
- **PHP**: 8.2+

### Frontend
- **Framework**: React 19.x
- **UI Library**: Material-UI (MUI) 7.x

### External Integrations
- **Nextcloud**: WebDAV file access
- **Google Images API**: Meal image retrieval
- **Mensa API**: Menu data integration

## 📦 Installation

### Prerequisites

Before starting, ensure you have the following installed on your machine:

- **PHP** 8.2 or higher ([Download](https://www.php.net/downloads))
- **Composer** 2.0 or higher ([Download](https://getcomposer.org/download/))
```bash
# Run as administrator in powershell...
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.4'))
```

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/downloads))

To verify installations, run:
```bash
php --version
composer --version
node --version
npm --version
git --version
```

---

## Step-by-Step Setup Guide

### Step 1: Clone the Repository

Open your terminal and clone the repository:

```bash
git clone https://github.com/EdBinder/dashboard.git
cd dashboard
```

---

### Step 2: Backend Setup (Laravel)

- Navigate to Backend Directory + Install all required PHP packages using Composer:
```bash
composer install
```

- Copy the example environment file to .env

- Open the `.env` file in a text editor and configure the following:

**Required Basic Configuration:**
```env
APP_NAME="IIIUS Dashboard"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (SQLite by default - no additional setup needed)
DB_CONNECTION=sqlite
```

```env
NEXTCLOUD_URL=https://your-nextcloud-server.com
NEXTCLOUD_USERNAME=your-username (Mail Adress !)
NEXTCLOUD_PASSWORD=your-app-password
NEXTCLOUD_FILE_PATH=/path/to/proposals.csv

#  Nextcloud Deck for Tasks (only use board ids the user can see)
# 12:team aufgaben 31:iadapt 33:regokargoTT 40:Marketing 45:persönlich 51:iadapt dev
# or use /api/tasks/boards/ route to get current boards + ids
NEXTCLOUD_DECK_DEFAULT_BOARDS=
```

```env
MENSA_API_URL=https://www.swfr.de/apispeiseplan
API_KEY=your-mensa-api-key
ORT_ID=641
```

```env
GOOGLE_CUSTOM_SEARCH_API_KEY=your-google-api-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id
```

> **Note**: Google Custom Search API setup:
> - Get API key from: https://developers.google.com/custom-search/v1/introduction
> - Create search engine at: https://cse.google.com/cse/
###
- Generate a unique application key for Laravel:
```bash
php artisan key:generate
```


- Start the Laravel backend server:
```bash
php artisan serve
```

The backend API should now be running at `http://localhost:8000`

**Keep this terminal running** and open a new terminal for the frontend setup.

---

### Step 3: Frontend Setup (React)

- Navigate to Frontend Directory + Install all required npm packages:
```bash
npm install
```

- Start the React development server:
```bash
npm start
```

The frontend should automatically open in your browser at `http://localhost:3000`


## Development Documentation

### API Endpoints

#### Health & Status
- `GET /api/health` - Service health check
- `GET /api/parser/health` - File parser service status
- `GET /api/tasks/health` - Tasks service status

#### Mensa (Cafeteria) Endpoints
- `GET /api/mensa` - Current mensa menu data
- `GET /api/mensa/with-images` - Mensa menu data with Google Images integration

#### Proposals/Applications
- `GET /api/proposals` - Proposal/application data from Nextcloud files

#### Tasks (Nextcloud Deck Integration)
- `GET /api/tasks` - All tasks from configured boards
- `GET /api/tasks/boards` - Available Nextcloud Deck boards
- `GET /api/tasks/boards/{boardId}` - Specific board details
- `GET /api/tasks/boards/{boardId}/stacks` - Stacks (columns) within a board
- `GET /api/tasks/boards/{boardId}/stacks/{stackId}/cards` - Cards (tasks) within a stack

#### Debug & Development (Local/Dev Only)
- `GET /api/debug/google-search/{searchTerm}` - Test Google Custom Search functionality
- `GET /api/debug/users` - Debug Nextcloud user data

> **Note**: Debug endpoints are only available in `local`, `development`, or `testing` environments.

### Adding New Services

1. **Create service class** in `backend/app/Services/`
2. **Register in controller** or use dependency injection
3. **Add corresponding API routes** in `routes/api.php`
4. **Update frontend components** to consume new endpoints

## 📁 Project Structure

```
dashboard/
├── backend/                    # Laravel API backend
│   ├── app/
│   │   ├── DTO/                # Data Transfer Objects
│   │   │   └── Mensa/          # Mensa-specific DTOs
│   │   ├── Http/
│   │   │   ├── Controllers/    # API controllers
│   │   │   └── Traits/         # Shared controller traits
│   │   ├── Services/           # Business logic services
│   │   │   └── Contracts/      # Service interfaces
│   │   └── Models/             # Eloquent models
│   ├── routes/api.php          # API routes definition
│   ├── config/                 # Laravel configuration
│   └── database/               # Migrations and seeders
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Mensa.js       # Mensa menu component
│   │   │   ├── Antraege.js    # Proposals component
│   │   │   ├── GridLayout.js  # Grid layout system
│   │   │   ├── ModuleSlot.js  # Individual module container
│   │   │   └── Tasks.js       # Nextcloud Deck-Task Module
│   │   ├── App.js             # Main application component
│   │   └── index.js           # Application entry point
│   └── public/                # Static assets and logos
│
└── README.md                  # This file
```



**Issues**: [GitHub Issues](https://github.com/EdBinder/dashboard/issues)

**Built with ❤️ for IIIUS**
