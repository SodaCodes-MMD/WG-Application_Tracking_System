# Production Database Configuration & Migration Strategy

## Overview

This document outlines the production database setup, migration strategy, and rollback procedures for the Application Tracking System.

## Database Technology

- **Database**: MongoDB (Atlas recommended for production)
- **ODM**: Mongoose v9.x
- **Connection**: Managed via `backend/src/db/connection.js`

## Connection Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection string | - | Yes |
| `MONGO_MAX_POOL_SIZE` | Maximum connection pool size | 10 | No |
| `MONGO_MIN_POOL_SIZE` | Minimum connection pool size | 5 | No |
| `MONGO_SERVER_SELECTION_TIMEOUT_MS` | Server selection timeout | 10000 | No |
| `MONGO_SOCKET_TIMEOUT_MS` | Socket timeout | 45000 | No |
| `MONGO_CONNECT_TIMEOUT_MS` | Connection timeout | 20000 | No |
| `RUN_MIGRATIONS_ON_START` | Auto-run migrations on startup | true | No |

### Production Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Connection Features

- **Automatic retry**: Up to 5 attempts with 5-second intervals
- **Connection pooling**: Configurable min/max pool sizes
- **Write retries**: Enabled for resilient writes
- **Read retries**: Enabled for resilient reads
- **Heartbeat**: 10-second interval for connection health monitoring

## Collections

| Collection | Model | Description |
|------------|-------|-------------|
| `users` | User | User accounts and authentication |
| `jobs` | Job | Job applications tracking |
| `profiles` | Profile | User profile data |
| `documents` | Document | Resume and document management |
| `notifications` | Notification | Deadline and system notifications |
| `passwordresettokens` | PasswordResetToken | Password reset tokens (TTL-based) |
| `migrations` | Migration | Migration tracking (internal) |

## Migration Strategy

### Directory Structure

```
backend/src/db/
├── connection.js           # Database connection module
├── migrate.js              # CLI migration runner
├── rollback.js             # CLI rollback script
├── models/
│   └── migration-model.js  # Migration tracking model
└── migrations/
    ├── runner.js           # Migration execution engine
    └── 001-initial-schema.js  # First migration
```

### Migration Naming Convention

Migrations follow the format: `<version>-<description>.js`

- Version: Zero-padded 3-digit number (001, 002, 003, etc.)
- Description: Kebab-case description of the migration

Example: `002-add-user-preferences.js`

### Migration File Structure

```javascript
export const version = "002";
export const name = "Add user preferences collection";

export const up = async (db) => {
  // Forward migration logic
};

export const down = async (db) => {
  // Rollback logic
};
```

### Running Migrations

#### Automatic (On Deploy)

Migrations run automatically on application startup when `RUN_MIGRATIONS_ON_START=true`.

Render deployment includes a `preDeployCommand` that runs migrations before the server starts.

#### Manual

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Rollback to specific version
npm run db:rollback:to <version>
```

### Migration Tracking

The `migrations` collection tracks:

- Version number
- Migration name
- Status (pending, running, completed, rolled_back)
- Applied timestamp
- Duration
- Errors (if any)

## Rollback Plan

### When to Rollback

- Migration fails with data corruption
- Schema change breaks application functionality
- Performance degradation after migration

### Rollback Procedures

#### Single Migration Rollback

```bash
cd backend
npm run db:rollback
```

#### Rollback to Specific Version

```bash
cd backend
npm run db:rollback:to 001
```

#### Emergency Rollback

1. Stop the application deployment
2. Restore previous application version
3. Run rollback to undo migrations:
   ```bash
   npm run db:rollback:to <last-known-good-version>
   ```

### Data Recovery

For data-level issues:

1. **MongoDB Atlas Point-in-Time Recovery**: Use Atlas backup restoration
2. **Manual Data Fix**: Write a corrective migration
3. **Collection Restore**: Restore from backup snapshots

## Indexes

All indexes are managed through migrations. The initial migration (001) creates:

### Users Collection
- `email: 1` (unique)
- `createdAt: -1`

### Jobs Collection
- `userId: 1, createdAt: -1`
- `userId: 1, archivedAt: 1`
- `userId: 1, status: 1`
- `deadline: 1`
- `archivedAt: 1`

### Documents Collection
- `userId: 1, createdAt: -1`
- `userId: 1, status: 1`
- `userId: 1, type: 1`

### Profiles Collection
- `userId: 1` (unique)

### Password Reset Tokens Collection
- `token: 1` (unique)
- `userId: 1`
- `expiresAt: 1` (TTL: auto-delete on expiry)

### Notifications Collection
- `userId: 1, read: 1, createdAt: -1`
- `userId: 1, jobId: 1, type: 1` (unique)
- `userId: 1, read: 1, emailSent: 1`

## Deployment Checklist

### Pre-Deployment

- [ ] Verify `MONGO_URI` is set in Render dashboard
- [ ] Verify `JWT_SECRET` is set with strong random value
- [ ] Verify backup exists before deploying schema changes
- [ ] Test migrations locally first

### Post-Deployment

- [ ] Check migration logs for successful completion
- [ ] Verify application health endpoint: `GET /api/health`
- [ ] Monitor connection pool metrics in Atlas
- [ ] Verify cron jobs are running (deadline checker)

### Monitoring

- MongoDB Atlas: Connection count, query performance, storage
- Application logs: Migration status, connection errors
- Render dashboard: Deploy status, health checks

## Adding New Migrations

1. Create new file in `backend/src/db/migrations/`
2. Follow naming convention: `<version>-<description>.js`
3. Implement `up` and `down` methods
4. Test locally: `npm run db:migrate`
5. Test rollback: `npm run db:rollback`
6. Commit and deploy

## Security Considerations

- Never commit `.env` files with credentials
- Use MongoDB Atlas IP whitelisting
- Use strong JWT secrets (min 32 characters)
- Rotate database credentials regularly
- Enable MongoDB Atlas encryption at rest
