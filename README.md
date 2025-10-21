# 121Hub Store

A modern SaaS platform for building and managing online stores with a visual editor, AI-enhanced design, and seamless e-commerce integration.  
Built with **Next.js**, **Express**, **Supabase**, **TailwindCSS**, **Radix UI**, **Shadcn UI**, and **Zustand** — designed for scalability and developer happiness.

---

## 🏗️ Monorepo Structure

This project is organized as a monorepo with two main workspaces:

- **`/api`** - Backend API (Express + TypeScript + Supabase)
- **`/web`** - Frontend Application (Next.js 15 + TypeScript)

For detailed folder structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 🚀 Tech Stack

### **Backend (API)**

- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Testing:** [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest)
- **Architecture:** Feature-based modular structure

### **Frontend (Web)**

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **UI Primitives:** [Radix UI](https://www.radix-ui.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)

### **Development Tools**

- **Package Manager:** [pnpm](https://pnpm.io/)
- **Linting & Formatting:** ESLint + Prettier
- **Version Control:** Git + GitHub Actions (CI/CD ready)

## ⚙️ Getting Started

### 1️⃣ Clone the repo

```bash
git clone https://github.com/121Hub/store.git
cd store
```

### 2️⃣ Install dependencies

Install dependencies for both workspaces:

```bash
# Install API dependencies
cd api
pnpm install

# Install Web dependencies
cd ../web
pnpm install
```

### 3️⃣ Set up environment variables

**For the API (`api/.env`):**

```env
PORT=8080
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_KEY=<your-supabase-service-key>
NODE_ENV=development
```

You can find these in your [Supabase project dashboard](https://app.supabase.com/).

**For the Web (`web/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> **Note:** The frontend communicates exclusively with the backend API. All database operations and authentication are handled by the API layer, which connects to Supabase.

### 4️⃣ Run the development servers

**Terminal 1 - API Server:**

```bash
cd api
pnpm dev
```

API runs on [http://localhost:8080](http://localhost:8080)

**Terminal 2 - Web Server:**

```bash
cd web
pnpm dev
```

Web app runs on [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

### Backend Tests

```bash
cd api

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration
```

### Test Structure

- **Unit Tests**: `api/tests/unit/` - Test individual functions and modules
- **Integration Tests**: `api/tests/integration/` - Test API endpoints
- **Test Helpers**: `api/tests/helpers/` - Mocks and utilities

---

## 📁 Project Structure

```
store/
├── api/          # Backend Express API
│   ├── src/
│   │   ├── features/     # Feature modules (auth, products, users)
│   │   ├── middleware/   # Express middleware
│   │   ├── config/       # Configuration files
│   │   └── utils/        # Utilities (Supabase, helpers)
│   └── tests/            # Separate test folder
│       ├── unit/
│       ├── integration/
│       └── helpers/
│
└── web/          # Frontend Next.js app
    └── src/
        ├── app/          # Next.js App Router pages
        ├── components/   # React components
        ├── lib/          # Utilities
        ├── hooks/        # Custom hooks
        ├── store/        # Zustand stores
        └── types/        # TypeScript types
```

For complete structure details, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 🗄️ Database & Prisma

- This project uses Prisma in the `api` package to manage the database schema, migrations, and to generate the Prisma Client used by the backend.
- Prisma schema and migration files live in `api/prisma/`.

Quick Prisma commands (run from `api/`):

```bash
# install (pnpm example)
cd api
pnpm add -D prisma
pnpm add @prisma/client

# create migrations and generate client
pnpm prisma migrate dev --name init

# introspect an existing DB
pnpm prisma db pull
# generate client
pnpm prisma generate
```

If you run into connection errors, verify `api/.env` contains `DATABASE_URL` and check SSL settings required by hosted providers (Supabase, AWS RDS, etc.).

## 🎨 Styling & Theming

- TailwindCSS powers the design system.
- Shadcn UI components are installed via the CLI:

```bash
pnpm dlx shadcn-ui@latest add button card dialog input
```

- Customize theme colors in tailwind.config.ts under the theme.extend.colors section.
- To change your base theme (neutral, slate, etc.), modify the CSS variables in globals.css.

## 🧩 UI Components

- Radix UI handles all accessible primitives (Popover, Dialog, Dropdown).
- Shadcn UI provides polished component wrappers (Button, Card, Input, etc.).
- You can mix and extend both easily.

## 🧠 State Management

- Global state handled via Zustand.
- Example:

```typescript
import { create } from 'zustand';

export const useStore = create((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

## 🧪 Code Quality

- Lint and format your code before committing:

```bash
pnpm lint
pnpm format
```

- The repo is CI-ready with GitHub Actions configured for:
  - Linting
  - Type checking
  - Build validation

## 🚀 Deployment

### Backend (API)

- **Recommended:** [Railway](https://railway.app/), [Render](https://render.com/), or [Fly.io](https://fly.io/)
- Set environment variables in your hosting platform
- Build command: `pnpm build`
- Start command: `pnpm start`

### Frontend (Web)

- **Recommended:** [Vercel](https://vercel.com/) (1-click Next.js deployment)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Select the `web` folder as the root directory
4. Add environment variables from `.env.local`

### Full Stack Deployment

- Deploy API first and get the production URL
- Update `NEXT_PUBLIC_API_URL` in web environment variables
- Deploy web application

## 🗺️ Roadmap

### Phase 1: Core Features

- [x] Project structure setup
- [x] Testing infrastructure
- [ ] Authentication & Authorization (JWT + Supabase)
- [ ] User Management
- [ ] Product CRUD operations
- [ ] Dashboard UI

### Phase 2: Advanced Features

- [ ] Drag-and-drop Page Builder
- [ ] AI-assisted Design Suggestions
- [ ] Order Management System
- [ ] Payment Integration (Stripe)
- [ ] File Upload & Media Management

### Phase 3: Platform Features

- [ ] Custom Domain & Publishing
- [ ] Admin Analytics & Store Insights
- [ ] Multi-tenant Support
- [ ] Email Notifications
- [ ] SEO Optimization Tools

## 📚 API Documentation

Once the API is running, you can access:

- **Health Check:** `GET http://localhost:8080/`
- **API Endpoints:** Documentation coming soon (Swagger/OpenAPI)

### Available Endpoints (Planned)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/users/profile` - Get user profile

---

## 🤝 Contributing

Pull requests are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `pnpm test` (in api folder)
5. Lint your code: `pnpm lint` (in web folder)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For questions or support, please open an issue on GitHub or contact the maintainers.

**Happy Coding! 🚀**
