require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to DB');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  for(const c of collections) {
    if(c.name.startsWith('tests_')) {
      console.log(`\nCollection: ${c.name}`);
      const docs = await db.collection(c.name).find({}).toArray();
      console.log(`Found ${docs.length} tests`);
      if(docs.length > 0) {
        console.log('Sample test:', docs[0]);
      }
    }
  }
  process.exit(0);
}

checkDB().catch(console.error);
