# Project Readme

## Project Overview

The purpose of this project is to provide an offline-first web application that allows users to manage a "Bourse au ski". 
The users are volunteers of the ski association whom main tasks are :
* Evaluating and adding articles from sellers, which creates a seller profile with a list of articles (price, description, brand, model name, main color, size)
* Selling articles to buyers. Buyers can only buy articles that were dropped by sellers.


Each user is attributed a "Computer" with a dedicated Id.

An admin part of the application is also available for admin to oversee the "Bourse au ski", like :
* A complete list of articles with basic filters capabilities (seller, sold...)
* The global amount for the entire sale (and per Computer)

---

## Technologies overview

To ensure an offline-first web application, the following technologies are used :
* service workers (to cache the application and make it available offline)
* IndexedDB (to store the data in the browser) (wrapped with dexie for a better experience)

The frontend app uses :
* React (for the frontend)
* Vite (for the build process)
* Tailwind CSS (for the styling)
* TanStack Router (for the routing)
* Dexie (for the IndexedDB)

## Getting Started

Follow these steps to set up the project locally on your machine:

### Prerequisites

1. Ensure you have **Node.js** (version 22 or above) installed on your system. You can verify the installation by running:
   ```bash
   node -v
   ```

2. Install pnpm globally using npm:
   ```bash
   npm install -g pnpm
   ```
   Verify the installation with:
   ```bash
   pnpm -v
   ```

---

### Installation

1. Clone the project repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate into the project directory:
   ```bash
   cd <project-directory>
   ```

3. Install dependencies with pnpm:
   ```bash
   pnpm install
   ```

---

### Running the Project

1. Start the development server using Vite:
   ```bash
   pnpm frontend dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   (The exact port may vary; the terminal will display the correct URL.)

---

### Build the Project for Production

1. To create an optimized production build, run:
   ```bash
   pnpm frontend build
   ```
---

## Project Structure

```plaintext
├── src/
│   ├── components/       // React components
│   ├── routes/           // Router configurations
│   └── main.tsx          // Entry point of the application
├── public/               // Static assets
├── package.json          // Project metadata and scripts
├── tailwind.config.js    // Tailwind CSS configuration
├── pnpm-lock.yaml        // pnpm lockfile
└── vite.config.ts        // Vite configuration
```

---

## Available Scripts

- **`pnpm frontenv dev`**: Start the development server.
- **`pnpm frontenv build`**: Build the app for production.

---

## Conclusion

This project setup provides a seamless workflow for building modern web applications. If you encounter any issues, feel free to reach out to the project maintainers.

Happy coding! 🎉
