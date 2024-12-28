const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/store');
const imageRoutes = require('./routes/images');
const dataRoutes = require('./routes/data');
const merchantRoutes = require('./routes/merchant');
const insertUserData = require('./routes/nzrmUsers');
const ipLocationRoutes = require('./routes/ipLocation');
const usersRoute = require('./routes/usersRoute');
const lamoorRoutes = require('./routes/nzd-routes/lamoor');
const Pusher = require('pusher');
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(fileUpload());



const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

pusher.trigger('my-channel', 'my-event', { message: 'hello world' })
  .catch(error => {
    console.error('Pusher Error:', error);
  });
  


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/ipLocation', ipLocationRoutes);
app.use('/api/nzrm-users', insertUserData);
app.use('/api/ip-stuff', usersRoute);
app.use('/api/lamoor', lamoorRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

