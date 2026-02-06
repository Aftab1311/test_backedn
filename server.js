const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const User = require('./models/User');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contact', contactRoutes);
app.use("/health", (req, res) => res.send("OK server running....")); // Health check endpoint

// Seed Admin User if not exists
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@sumpro.com' });
    if (!adminExists) {
      const user = await User.create({
        name: 'SumPro Admin',
        email: 'admin@sumpro.com',
        password: 'admin123', // Will be hashed by pre-save hook
        isAdmin: true,
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

seedAdmin();

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));