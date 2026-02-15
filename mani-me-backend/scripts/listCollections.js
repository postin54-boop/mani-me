require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections in database:');
  for (const col of cols) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`  - ${col.name}: ${count} documents`);
  }
  await mongoose.disconnect();
});
