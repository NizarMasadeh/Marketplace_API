const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/store');
const imageRoutes = require('./routes/images');
const dataRoutes = require('./routes/data');
const merchantRoutes = require('./routes/merchant');
const insertUserData = require('./routes/nzrmUsers');
const ipLocationRoutes = require('./routes/ipLocation');
const { setSocketInstance } = require('./controllers/productController')
const { setMerchantSocket } = require('./controllers/merchantController')
const usersRoute = require('./routes/usersRoute');
require('dotenv').config();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log('Connected socket: ', socket.id);
  socket.emit('connection', { message: 'Welcome to the server!' });
})

setSocketInstance(io);
setMerchantSocket(io);

delete require.cache[require.resolve('./routes/merchant')];
delete require.cache[require.resolve('./controllers/merchantController')];


// In your server.js
app.set('trust proxy', true);
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(fileUpload());

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
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
