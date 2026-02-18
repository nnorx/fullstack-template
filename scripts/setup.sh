#!/usr/bin/env bash
# First-time project setup script.
# Copies .env.example, generates a secret, starts the dev database,
# runs migrations, and seeds sample data.

set -euo pipefail

echo ""
echo "=== Fullstack Template Setup ==="
echo ""

# 1. Environment file
if [ -f .env ]; then
	echo "✓ .env already exists"
else
	cp .env.example .env
	# Generate a random BETTER_AUTH_SECRET
	SECRET=$(openssl rand -base64 32)
	if [[ "$OSTYPE" == "darwin"* ]]; then
		sed -i '' "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${SECRET}|" .env
	else
		sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${SECRET}|" .env
	fi
	echo "✓ Created .env with generated BETTER_AUTH_SECRET"
fi

# 2. Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# 3. Build shared package (needed before other packages can import it)
echo ""
echo "Building shared package..."
pnpm --filter @fullstack-template/shared build

# 4. Start dev database
echo ""
echo "Starting development database..."
pnpm dev:db

# 5. Run migrations
echo ""
echo "Running database migrations..."
pnpm db:migrate

# 6. Seed sample data
echo ""
echo "Seeding sample data..."
pnpm db:seed

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Run 'pnpm dev' to start developing."
echo ""
