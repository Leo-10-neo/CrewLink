const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/event-management').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log("Users in DB:");
  users.forEach(u => console.log(`Email: ${u.email}, Role: ${u.role}, PasswordHash: ${u.password}`));
  process.exit(0);
}).catch(console.error);
