const mongoose = require('mongoose');

const urls = [
  'mongodb+srv://student:student@cluster0.4v1gsem.mongodb.net/marks',
  'mongodb+srv://ahk:ahk@cluster0.4v1gsem.mongodb.net/marks',
  'mongodb+srv://<student>:<student>@cluster0.4v1gsem.mongodb.net/marks',
  'mongodb+srv://%3Cstudent%3E:%3Cstudent%3E@cluster0.4v1gsem.mongodb.net/marks',
  'mongodb+srv://student:student@cluster0.4v1gsem.mongodb.net/',
  'mongodb+srv://ahk:ahk@cluster0.4v1gsem.mongodb.net/'
];

function redact(url) {
  return url.replace(/:([^:@]+)@/, ':***@');
}

async function run() {
  for (const dbUrl of urls) {
    console.log(`\nTesting: ${redact(dbUrl)}`);
    try {
      await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 4000
      });
      console.log(`✅ SUCCESS connecting to ${redact(dbUrl)}`);
      
      // Let's also test reading from it
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   Collections found: ${collections.map(c => c.name).join(', ')}`);
      
      await mongoose.disconnect();
      return; 
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
    }
  }
  console.log('\nAll connection attempts failed.');
  process.exit(1);
}

run();
