# ALL-AI Backend (Node + Express + MongoDB)

This backend provides authentication for the ALL-AI frontend using JWT and MongoDB.

## Features

- POST `/api/auth/signup` — Create an account, returns `{ token, user }`
- POST `/api/auth/signin` — Sign in, returns `{ token, user }`
- GET `/api/health` — Health check

## Requirements

- Node 18+
- MongoDB running locally or a MongoDB connection string

## Setup

1. Create a `.env` file in this folder using `.env.example` as a template.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (default http://127.0.0.1:4000):
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for the full list. Minimal required values:

- `MONGO_URI` — e.g. `mongodb://127.0.0.1:27017/allai`
- `JWT_SECRET` — random secret string

## Project Structure

- `server.js` — Entry point that starts Express and connects to MongoDB
- `src/models/User.js` — Mongoose User model
- `src/routes/auth.js` — Auth routes for signup/signin

## Response Shape

- Success:
  ```json
  {
    "token": "<JWT>",
    "user": { "id": "...", "email": "user@example.com", "name": "Optional" }
  }
  ```
- Errors:
  ```json
  { "error": "message" }
  ```

## Notes

- CORS is enabled for local development.
- Tokens expire in 7 days. Change in `src/routes/auth.js` if needed.
