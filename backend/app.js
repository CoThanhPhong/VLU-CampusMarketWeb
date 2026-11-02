const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.get('/', (req, res) => res.send('Backend is running...'));

module.exports = app;