# Security Guide

This document outlines security considerations and best practices for deploying and maintaining this template.

## 🔐 Pre-Production Security Checklist

### Critical (Must Complete Before Going Live)

- [ ] **Generate Strong BETTER_AUTH_SECRET**
  ```bash
  # Generate a cryptographically secure 32-byte secret
  openssl rand -base64 32
  ```
  Add this to your `.env` file and NEVER commit it to version control.

- [ ] **Set Strong Database Credentials**
  ```bash
  # In production .env
  POSTGRES_USER=your_custom_user
  POSTGRES_PASSWORD=$(openssl rand -base64 32)
  DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/fullstack_template
  ```

- [ ] **Configure Production URLs**
  ```bash
  BETTER_AUTH_URL=https://yourdomain.com
  FRONTEND_URL=https://yourdomain.com
  ```

- [ ] **Enable HTTPS**
  - Cloudflare Tunnel provides automatic HTTPS
  - Ensure `BETTER_AUTH_URL` uses `https://` in production

- [ ] **Review Exposed Ports**
  - Database port 5432 should NOT be exposed (already fixed in docker-compose.yml)
  - Only port 80 (Caddy) should be accessible, proxied via cloudflared

### High Priority (Strongly Recommended)

- [ ] **Enable Email Verification**
  
  Better Auth supports email verification but requires an email provider. Update `apps/api/src/lib/auth.ts`:
  
  ```typescript
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Implement with your email provider (Resend, SendGrid, etc.)
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<a href="${url}">Verify Email</a>`,
      });
    },
  }
  ```

- [ ] **Enable Content Security Policy**
  
  A production-ready CSP is configured in the Caddyfile in report-only mode for testing:
  
  ```
  Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
  ```
  
  **To enable CSP:**
  1. Test in report-only mode first (already configured) - deploys with logging but no blocking
  2. Monitor browser console for violations during typical usage
  3. Once validated, change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in the Caddyfile to enforce
  
  **Note on `'unsafe-inline'` for styles:** This is required for Radix UI components (used by shadcn/ui) which apply inline styles for positioning and animations. The security risk is minimal since scripts are still strictly controlled.

- [ ] **Set Up Security Monitoring**
  - Monitor authentication failures
  - Set up alerts for unusual activity
  - Log all admin actions

- [ ] **Configure Backup Strategy**
  - Regular PostgreSQL backups
  - Test restoration process
  - Store backups securely off-site

### Medium Priority (Important for Production)

- [ ] **Add Account Lockout**
  - Implement account lockout after N failed login attempts
  - Use Better Auth's `banned` field or implement custom logic

- [ ] **Enable Audit Logging**
  - Log authentication events (login, logout, failed attempts)
  - Log admin actions (ban user, change roles)
  - Store logs securely with retention policy

- [ ] **Set Up Dependency Scanning**
  - Enable Dependabot on GitHub
  - Regularly run `pnpm audit`
  - Update dependencies promptly

- [ ] **Review CORS Configuration**
  - `trustedOrigins` in Better Auth should only include your actual domains
  - Remove `localhost` origins in production

## 🔍 Security Features Already Implemented

✅ **Password Hashing**: Better Auth handles bcrypt password hashing automatically

✅ **Password Complexity**: 12+ characters with uppercase, lowercase, number, and special character required

✅ **Rate Limiting**: Auth endpoints (20 req/15min) and API endpoints (100 req/15min) protected

✅ **SQL Injection Protection**: Drizzle ORM provides parameterized queries

✅ **CSRF Protection**: Better Auth includes CSRF tokens for state-changing operations

✅ **Secure Session Management**: HTTP-only cookies with secure settings

✅ **XSS Protection Headers**: Basic headers configured in Caddyfile

✅ **Environment Variable Validation**: Zod validation prevents misconfigurations

✅ **Dependency Isolation**: Docker containers limit attack surface

✅ **Non-root Docker User**: Runtime images run as unprivileged user (node:22-alpine default)

✅ **Database Port Isolation**: PostgreSQL not exposed to internet in production config

## 🚨 Common Security Pitfalls to Avoid

❌ **DON'T** commit `.env` files to version control

❌ **DON'T** use the same `BETTER_AUTH_SECRET` across environments

❌ **DON'T** expose database ports to the internet

❌ **DON'T** run containers as root in production

❌ **DON'T** disable TypeScript strict mode

❌ **DON'T** trust client-side validation alone (always validate on server)

❌ **DON'T** log sensitive data (passwords, tokens, PII)

❌ **DON'T** use HTTP in production (always HTTPS)

## 🔄 Regular Security Maintenance

### Monthly
- Review and update dependencies
- Check for security advisories
- Review access logs for anomalies

### Quarterly
- Rotate `BETTER_AUTH_SECRET` and database credentials
- Review and update RBAC policies
- Audit user accounts and permissions
- Test backup restoration

### Annually
- Security audit by external party
- Penetration testing
- Review and update security policies

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Better Auth Security Docs](https://www.better-auth.com/docs/security)
- [Hono Security Best Practices](https://hono.dev/docs/guides/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 🐛 Reporting Security Issues

If you discover a security vulnerability, please report it privately:

1. **DO NOT** open a public GitHub issue
2. Use [GitHub Security Advisories](https://github.com/nnorx/fullstack-template/security/advisories/new), or contact the maintainers via the email in the repository metadata
3. Include detailed reproduction steps and affected versions
4. Allow reasonable time for a fix before public disclosure
