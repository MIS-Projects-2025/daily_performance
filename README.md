# 📘 Project Setup Guide

A quickstart guide to install and run the application locally.

---

## 📦 Install Dependencies

### 1. Composer

```bash
composer install
```

### 2. NPM

```bash
npm install
```

---

## ⚙️ Environment Setup

Copy the example environment file and set the required variables (duplicate and rename or by terminal):

```bash
cp .env.example .env
```

Then generate the application key:

```bash
php artisan key:generate
```

---

## 🗃️ Database Migration

Run migrations with seeding to create required tables and seed system data:

```bash
php artisan migrate --seed
```

This will:

- Create the `system_status` table
- Seed the system status (online/maintenance)
- Set up HRIS configuration

---

## 🎨 Customization

### Root Color

To change the root color theme, edit the CSS variables in:

```
resources/css/app.css
```

Update the `:root` section with your desired HSL color values:

```css
:root {
    --primary: 142 72% 29%;
    --primary-foreground: 0 0% 98%;
    /* ...other variables */
}
```

---

## 🏗️ Architecture

### Technology Stack

- **Backend**: Laravel 11
- **Frontend**: Tailwind CSS + DaisyUI + ShadCN
- **Database**: MySQL/SQLite
- **Authentication**: Session-based (Authify)

### Project Structure

```
├── app/
│   ├── Http/           # Controllers, Middleware
│   └── Models/         # Eloquent models
├── database/
│   ├── migrations/     # Database migrations
│   └── seeders/        # Database seeders
├── resources/
│   ├── css/            # Tailwind styles
│   └── views/          # Blade templates
├── routes/              # Application routes
└── config/             # Configuration files
```

### Database Schema

- **users**: Application users
- **system_status**: System operational status (online/maintenance)
- **authify**: External authentication database
- **jobs**: Queue jobs table

---

## ✅ Done

You're now ready to start the application!

```bash
composer run dev
```

---
