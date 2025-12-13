// MongoDB initialization script
// Creates the application database and user

// Switch to the clouddesk database
db = db.getSiblingDB('clouddesk');

// Create application user with readWrite access
db.createUser({
  user: 'clouddesk',
  pwd: process.env.MONGO_PASSWORD || 'clouddesk_app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'clouddesk'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.instances.createIndex({ userId: 1, status: 1 });
db.instances.createIndex({ userId: 1, name: 1 });
db.instances.createIndex({ tags: 1 });
db.instances.createIndex({ createdAt: -1 });

db.sessions.createIndex({ userId: 1, status: 1 });
db.sessions.createIndex({ instanceId: 1, status: 1 });
db.sessions.createIndex({ lastActivityAt: 1, status: 1 });
db.sessions.createIndex({ createdAt: -1 });

db.auditlogs.createIndex({ userId: 1, createdAt: -1 });
db.auditlogs.createIndex({ action: 1, createdAt: -1 });
db.auditlogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

print('CloudDesk database initialized successfully');
