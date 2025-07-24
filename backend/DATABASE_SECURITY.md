# Database Security Configuration

## For SQLite (Development)
- File permissions: 600 (read/write for owner only)
- Store database file outside web root
- Regular backups with encryption

## For PostgreSQL (Production)

### Connection Security
```sql
-- Enable SSL connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';

-- Require SSL for all connections
ALTER SYSTEM SET ssl_mode = 'require';
```

### User Management
```sql
-- Create application user with limited privileges
CREATE USER apartment_app WITH PASSWORD 'secure_password_here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE apartment_rental TO apartment_app;
GRANT USAGE ON SCHEMA public TO apartment_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO apartment_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO apartment_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE apartment_rental FROM PUBLIC;
```

### IP Restrictions
```sql
-- In pg_hba.conf, restrict connections by IP
host apartment_rental apartment_app 10.0.0.0/8 scram-sha-256
host apartment_rental apartment_app 192.168.0.0/16 scram-sha-256

-- Deny all other connections
host all all 0.0.0.0/0 reject
```

### Database Configuration
```sql
-- Enable logging
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Set secure authentication
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Limit connections
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET max_user_connections = 10;
```

### Backup Security
```bash
# Encrypted backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="apartment_rental_backup_$DATE.sql"
ENCRYPTED_FILE="apartment_rental_backup_$DATE.sql.gpg"

# Create backup
pg_dump -h localhost -U apartment_app apartment_rental > $BACKUP_FILE

# Encrypt backup
gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 --output $ENCRYPTED_FILE $BACKUP_FILE

# Remove unencrypted backup
rm $BACKUP_FILE

# Upload to secure storage
aws s3 cp $ENCRYPTED_FILE s3://secure-backups/apartment-rental/

# Clean up local encrypted file
rm $ENCRYPTED_FILE
```

### Monitoring Queries
```sql
-- Monitor for suspicious activity
SELECT 
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE state = 'active'
    AND client_addr IS NOT NULL
    AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start DESC;

-- Check for failed login attempts
SELECT 
    log_time,
    user_name,
    database_name,
    connection_from,
    message
FROM pg_log
WHERE message LIKE '%authentication failed%'
ORDER BY log_time DESC
LIMIT 100;
```

## Environment Variables for Database Security

```bash
# Development
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://apartment_app:secure_password@db-host:5432/apartment_rental?sslmode=require"
DB_SSL_CERT="/path/to/client-cert.pem"
DB_SSL_KEY="/path/to/client-key.pem"
DB_SSL_CA="/path/to/ca-cert.pem"

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE=10000
DB_POOL_ACQUIRE=60000
```

## Prisma Security Configuration

```typescript
// In database.ts
import { PrismaClient } from '@prisma/client';
import { config } from './env';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: ['error', 'warn'],
  // Disable in production to prevent schema introspection
  ...(config.nodeEnv === 'production' && {
    errorFormat: 'minimal',
  }),
});

// Add connection pool configuration for production
if (config.nodeEnv === 'production') {
  // Implement connection pool limits
  prisma.$on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
```