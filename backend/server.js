require('dotenv').config();
const app = require('./app');
const connectDB = require('./db/db');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET not set');
}

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Backend running on Localhost:${PORT}`));
}).catch(err => {
  console.error('DB connection error', err);
  process.exit(1);
});