const app = require('./app');
const connectDB = require('./db/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on Localhost:${PORT}`));
}).catch(err => {
  console.error('DB connection error', err);
  process.exit(1);
});