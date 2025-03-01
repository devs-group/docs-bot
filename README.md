# DocsBot - AI-Powered Document Assistant

DocsBot is a modern web application that allows users to create AI-powered chatbots and voice content from their documents. Built with Next.js, TypeScript, and powered by OpenAI and ElevenLabs, this application enables users to upload documents or provide URLs, and then interact with the content through conversational AI or listen to voice narrations.

## Features

### Chatbot Creation
- Upload PDF documents or provide URLs as knowledge sources
- Create AI-powered chatbots that can answer questions about your documents
- Customize the AI model and prompt templates
- Test your chatbots directly in the application

### Voice Generation
- Generate voice narrations from your documents
- Choose from multiple voice types provided by ElevenLabs
- Customize the length of the voice message (1-5 minutes)
- Listen to the generated audio directly in the application

### User Management
- Secure authentication with NextAuth
- Personal dashboard to manage your chatbots and voice content
- Easy navigation between different features

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with pgvector for vector embeddings
- **AI/ML**: OpenAI API, LangChain, ElevenLabs API
- **Authentication**: NextAuth.js
- **Containerization**: Docker
- **ORM**: Drizzle ORM

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Docker and Docker Compose (for PostgreSQL with pgvector)
- OpenAI API key
- ElevenLabs API key
- GitHub OAuth credentials (for authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/devs-group/docs-bot.git
   cd docs-bot
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp example.env .env.local
   ```
   Then edit `.env.local` to add your API keys and configuration.

4. Start the PostgreSQL database with Docker:
   ```bash
   pnpm run docker:up
   ```

5. Run database migrations:
   ```bash
   pnpm run db:migrate
   ```

6. Start the development server:
   ```bash
   pnpm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

Create a `.env.local` file with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-generate-one-with-openssl-rand-base64-32
GITHUB_ID=github-client-id
GITHUB_SECRET=github-client-secret
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

## Database Management

DocsBot uses Drizzle ORM with PostgreSQL and pgvector for storing document embeddings. The following commands are available for database management:

```bash
# Generate migration files
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Drop all tables (caution!)
pnpm run db:drop

# Push schema changes directly to the database
pnpm run db:push
```

## Docker

The application includes a Docker Compose configuration for running PostgreSQL with pgvector:

```bash
# Start the database
pnpm run docker:up

# Stop the database
pnpm run docker:down
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
