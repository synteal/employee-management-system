# Employee Management System

## About this project

We use FastAPI and MongoDb to serve an API for employee management.
React 19 + React Compiler as a separate frontend.

### How to run this project

Both frontend and backend have their own .env to fill out, look at .env.example for values required.
Set up your MongoDb instance and update the connection string in the `.env` file. Look at `.env.example` for reference.

#### Local Development
To run the backend:
```sh
cd backend
uv run fastapi dev
```

To run the vite frontend:
```sh
cd frontend
npm run dev # Alternatively bun or pnpm
```

To test our frontend: `cd frontend && bun run test` (Note how we are not using `bun test` because of our requirements to use vitest)
To test our backend: `cd backend && uv run pytest`

For agentic use:
.agents/rules/style-guide.md contains the general guidelines for an agent working in this project. Note that this specific file-path is for Antigravity; if you use another you can copy and paste the instructions.
