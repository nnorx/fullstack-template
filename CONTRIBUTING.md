# Contributing to Fullstack Template

Thank you for your interest in contributing! This document provides guidelines for contributing to this template.

## Development Setup

1. **Prerequisites**
   - Node.js 22+
   - pnpm 10.28.0+ (or use `corepack enable`)
   - Docker & Docker Compose
   - PostgreSQL (for local development)

2. **Clone and Install**
   ```bash
   git clone https://github.com/nnorx/fullstack-template
   cd fullstack-template
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start Development**
   ```bash
   # Start database
   docker compose -f infra/docker-compose.dev.yml up -d
   
   # Push schema to database
   pnpm db:push
   
   # Start dev servers
   pnpm dev
   ```

## Pull Request Process

1. **Fork the Repository**
   - Create your own fork on GitHub
   - Clone your fork locally

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clear, concise commit messages
   - Follow the existing code style (Biome enforced)
   - Add tests for new features
   - Update documentation as needed

4. **Verify Your Changes**
   ```bash
   pnpm lint       # Check code style
   pnpm type-check # Check TypeScript
   pnpm test       # Run tests
   pnpm build      # Verify builds
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with details

## Code Style

- **Linting**: We use Biome for formatting and linting
  - Run `pnpm format` to auto-fix issues
  - Configuration: `biome.json`

- **TypeScript**: Strict mode enabled
  - All code must be type-safe
  - No `any` types (use `unknown` if needed)

- **Testing**: We use Vitest
  - Write tests for new features
  - Maintain/update existing tests
  - Aim for meaningful coverage

## Commit Convention

We follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or tooling changes

Examples:
```
feat: add user profile page
fix: correct login redirect
docs: update deployment guide
```

## Areas for Contribution

### High Priority
- Improved test coverage
- Additional authentication providers (OAuth, magic links)
- Enhanced error handling and logging
- Performance optimizations
- Accessibility improvements

### Documentation
- Tutorial content
- Video guides
- Translation to other languages
- Example applications

### Features
- Additional UI components (shadcn/ui)
- Database migration examples
- Monitoring/observability setup
- Additional deployment targets

### Infrastructure
- Kubernetes deployment configurations
- Cloud provider templates (AWS, GCP, Azure)
- CI/CD improvements
- Automated security scanning

## Questions or Issues?

- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Join our community (link TBD)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow GitHub's Community Guidelines

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
