# Kumora Social API

A production-quality REST API for a social media platform built with Node.js, Express, MongoDB, and Mongoose.  
It supports user authentication, posts (drafts and published), follows, likes, and a personalized feed.  
The API is fully tested with Jest and Supertest.
Built by **Kuku Mubaraq Afolabbi**.


## Features

- **User Authentication** – Sign up & sign in with JWT (1-hour expiry), bcrypt password hashing.
- **Posts** – Create, read, update, delete, publish. Drafts are private; only published posts appear publicly.
- **Ownership & Authorization** – Only the post owner can edit, delete, or publish.
- **Public Listing** – Paginated, searchable by author/title/tags, sortable by like_count, comment_count, timestamp.
- **My Posts** – Authenticated user can see their own posts filtered by state (draft/published).
- **Follow System** – Follow/unfollow users (no self-follow, no duplicates). List followers/following.
- **Like System** – Like/unlike posts (no duplicates). Like count updates automatically.
- **Personalized Feed** – Shows published posts from the current user and followed users.
- **Fully Tested** – Automated tests for all endpoints and edge cases.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT, bcrypt
- **Environment Variables:** dotenv
- **Testing:** Jest, Supertest, mongodb‑memory‑server

## Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-username/social-app-api.git
   cd social-app-api
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a \`.env\` file in the root (see \`.env.example\` for required variables):
   \`\`\`
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/social-app   # or your Atlas URI
   JWT_SECRET=your_random_secret_string
   \`\`\`

4. Start the server:
   \`\`\`bash
   npm run dev      # development (nodemon)
   \`\`\`
   Or for production:
   \`\`\`bash
   npm start
   \`\`\`
   The API will be running at \`http://localhost:3000\`.

## API Documentation

### Authentication
| Method | Endpoint          | Access     | Purpose                |
|--------|-------------------|------------|------------------------|
| POST   | /auth/signup      | Public     | Register a new user    |
| POST   | /auth/signin      | Public     | Login, receive JWT token |

### Posts
| Method | Endpoint              | Access        | Purpose                              |
|--------|-----------------------|---------------|--------------------------------------|
| GET    | /posts                | Public        | List published posts (paginated)     |
| GET    | /posts/:id            | Public        | Get a published post + author info   |
| POST   | /posts                | Authenticated | Create a new post (draft)            |
| PATCH  | /posts/:id            | Owner only    | Edit post (title, content, tags)     |
| DELETE | /posts/:id            | Owner only    | Delete a post                        |
| PUT    | /posts/:id/publish    | Owner only    | Publish a draft post                 |

### Me (Authenticated User)
| Method | Endpoint                | Access        | Purpose                               |
|--------|-------------------------|---------------|---------------------------------------|
| GET    | /me/posts               | Authenticated | Get my posts (filterable by state)    |
| POST   | /me/follow/:userId      | Authenticated | Follow a user                         |
| DELETE | /me/follow/:userId      | Authenticated | Unfollow a user                       |
| GET    | /me/following           | Authenticated | List users I follow                   |
| GET    | /me/followers           | Authenticated | List users following me               |

### Likes
| Method | Endpoint              | Access        | Purpose          |
|--------|-----------------------|---------------|------------------|
| POST   | /posts/:id/like       | Authenticated | Like a post      |
| DELETE | /posts/:id/like       | Authenticated | Unlike a post    |

### Feed
| Method | Endpoint | Access        | Purpose                               |
|--------|----------|---------------|---------------------------------------|
| GET    | /feed    | Authenticated | Personalized feed (self + followed)   |

### Query Parameters for GET /posts & GET /me/posts
- **page** – page number (default 1)
- **limit** – posts per page (default 20)
- **state** – for /me/posts only: "draft" or "published"
- **author** – search by author name (case‑insensitive)
- **title** – search by title keyword (case‑insensitive)
- **tags** – comma‑separated list (e.g., ?tags=tech,news)
- **sort** – field: "like_count", "comment_count", or "timestamp"
- **order** – "asc" or "desc" (default desc)

## Testing

The project includes a comprehensive test suite using Jest and Supertest.  
It uses an in‑memory MongoDB database, so no external database is needed for testing.

Run the tests:
\`\`\`bash
npm test
\`\`\`

Tests cover:
- Authentication (signup, signin, token validation)
- Post CRUD & ownership rules
- Public listing, search, sort, pagination
- Follow / unfollow logic and rules
- Like / unlike logic and count updates
- Personalized feed
- Authorization and validation errors

## Hosted API

**Live URL:**  [https://social-app-api-hp49.onrender.com] 

## GitHub Repository

**Repo URL:** [https://github.com/your-username/social-app-api]

## License

ISC