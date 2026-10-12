/**
 * CrewLink MongoDB Atlas Data Migration Script
 * 
 * Migrates all local MongoDB collections (users, events, volunteer profiles,
 * bookings, certificates, tasks, notifications) directly to MongoDB Atlas.
 * 
 * Usage:
 *   node migrate_to_atlas.cjs "mongodb+srv://<user>:<pass>@cluster0.ekfi5a.mongodb.net/event-management?retryWrites=true&w=majority&appName=Cluster0"
 */

const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/event-management';
const TARGET_URI = process.argv[2] || process.env.MONGODB_URI;

if (!TARGET_URI || TARGET_URI.includes('<db_password>')) {
  console.error('\n❌ Error: Please provide your MongoDB Atlas connection string with your actual password.');
  console.log('\nUsage:');
  console.log('  node migrate_to_atlas.cjs "mongodb+srv://4mh23is068a_db_user:YOUR_PASSWORD@cluster0.ekfi5a.mongodb.net/event-management?retryWrites=true&w=majority&appName=Cluster0"\n');
  process.exit(1);
}

// Ensure database name is in the URI
let sanitizedTargetUri = TARGET_URI;
if (sanitizedTargetUri.includes('.mongodb.net/?') || sanitizedTargetUri.endsWith('.mongodb.net/')) {
  sanitizedTargetUri = sanitizedTargetUri.replace('.mongodb.net/', '.mongodb.net/event-management');
}

async function migrate() {
  console.log('========================================================');
  console.log('🚀 CrewLink MongoDB -> MongoDB Atlas Migration Tool');
  console.log('========================================================\n');

  console.log('1. Connecting to local MongoDB at', LOCAL_URI, '...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('   ✅ Connected to local MongoDB.\n');

  const maskedUri = sanitizedTargetUri.replace(/:([^:@]+)@/, ':****@');
  console.log('2. Connecting to MongoDB Atlas at', maskedUri, '...');
  
  let atlasConn;
  try {
    atlasConn = await mongoose.createConnection(sanitizedTargetUri, {
      serverSelectionTimeoutMS: 10000
    }).asPromise();
    console.log('   ✅ Connected to MongoDB Atlas successfully!\n');
  } catch (err) {
    console.error('   ❌ Connection to MongoDB Atlas failed:', err.message);
    console.log('\nTip: If you got a timeout, check that Network Access in MongoDB Atlas allows 0.0.0.0/0 (Anywhere).');
    process.exit(1);
  }

  const collections = await localConn.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name).filter(n => !n.startsWith('system.'));

  console.log(`3. Found ${collectionNames.length} collection(s) to migrate:`);
  console.log('   ' + collectionNames.join(', ') + '\n');

  let totalDocsMigrated = 0;

  for (const name of collectionNames) {
    const localCollection = localConn.db.collection(name);
    const atlasCollection = atlasConn.db.collection(name);

    const docs = await localCollection.find({}).toArray();
    if (docs.length === 0) {
      console.log(`   ⏩ [${name}]: 0 documents (skipped)`);
      continue;
    }

    // Insert or update documents into Atlas (upsert by _id so script can be safely re-run)
    const operations = docs.map(doc => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true
      }
    }));

    const result = await atlasCollection.bulkWrite(operations);
    const upsertedCount = (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.matchedCount || 0);
    totalDocsMigrated += docs.length;

    console.log(`   ✅ [${name}]: Migrated ${docs.length} document(s)`);
  }

  console.log('\n========================================================');
  console.log(`🎉 Migration Completed Successfully! Total: ${totalDocsMigrated} document(s) in Atlas.`);
  console.log('========================================================\n');

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
