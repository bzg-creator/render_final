const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


// MongoDB connection
mongoose.connect('mongodb+srv://bzg:12341234@cluster0.vjb0u.mongodb.net/user_collection?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  // Create admin user if doesn't exist
  createAdminUser();
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ username: 'yelarys' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'yelarys',
        password: hashedPassword,
        isAdmin: true,
        createdAt: new Date()
      });
      console.log('Admin user created');
    }
  } catch (err) {
    console.error('Error creating admin:', err);
  }
}

// Configure express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// Session configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

const OPENWEATHER_API_KEY = '35969e08ae6c042dca65746208702818'; 
const MOVIES_API_KEY = 'ef6ec19b59mshe456a56f96330aap170096jsnfd75d5a51584'; 

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  deletedAt: Date
});

const User = mongoose.model('User', userSchema);

// API History Schema
const historySchema = new mongoose.Schema({
  userId: String,
  requestType: String,
  requestData: Object,
  responseData: Object,
  timestamp: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

// Item Schema
const itemSchema = new mongoose.Schema({
  images: [String], // Array of image URLs
  name_en: String,   // Name in English
  name_kz: String,   // Name in Kazakh
  description_en: String, // Description in English
  description_kz: String, // Description in Kazakh
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  deletedAt: Date
});

const Item = mongoose.model('Item', itemSchema);

// Auth Middleware
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.redirect('/');
  }
};

// Routes
// Update the login route
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { errorMessage: null, registerError: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.render('login', { errorMessage: 'Invalid username or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render('login', { errorMessage: 'Invalid username or password' });
        }

        req.session.user = user;
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { errorMessage: 'An error occurred during login' });
    }
});

// Add this after your existing login routes

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('login', { registerError: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            username,
            password: hashedPassword,
            isAdmin: false,
            createdAt: new Date()
        });

        // Log user in automatically
        req.session.user = user;
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('login', { registerError: 'Error during registration' });
    }
});

app.get('/admin', requireAdmin, async (req, res) => {
  const users = await User.find({ deletedAt: null });
  res.render('admin', { users });
});

// Existing routes with added history logging
app.get('/weather', requireAuth, async (req, res) => {
  try {
    const city = req.query.city || 'London';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    
    // Log API request to history
    await new History({
      userId: req.session.user._id,
      requestType: 'weather',
      requestData: { city },
      responseData: response.data
    }).save();
    
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

//Bonus Route (14-day forecast)
app.get('/forecast', requireAuth, async (req, res) => {
  try {
    const city = req.query.city || 'London';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    
    // Log API request to history
    await new History({
      userId: req.session.user._id,
      requestType: 'forecast',
      requestData: { city },
      responseData: response.data
    }).save();
    
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Existing API routes already prefixed with /api
app.get('/api/movies', requireAuth, async (req, res) => {
  try {
    const title = req.query.title || 'inception';
    const response = await axios.get(`https://moviesdatabase.p.rapidapi.com/titles/search/title/${title}`, {
      headers: {
        'X-RapidAPI-Host': 'moviesdatabase.p.rapidapi.com',
        'X-RapidAPI-Key': MOVIES_API_KEY
      },
      params: {
        exact: false,
        titleType: 'movie'
      }
    });

    await new History({
      userId: req.session.user._id,
      requestType: 'movies',
      requestData: { title },
      responseData: response.data
    }).save();

    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/api/movie-quotes', requireAuth, async (req, res) => {
  try {
    const count = req.query.count || 1;
    const response = await axios.get(`https://api.breakingbadquotes.xyz/v1/quotes/${count}`);

    await new History({
      userId: req.session.user._id,
      requestType: 'movie-quotes',
      requestData: { count },
      responseData: response.data
    }).save();

    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Edit form route
app.get('/admin/users/edit/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.redirect('/admin');
        }
        res.render('edit-user', { user });
    } catch (error) {
        console.error('Error loading user:', error);
        res.redirect('/admin');
    }
});

// Handle edit form submission
app.post('/admin/users/edit/:id', requireAdmin, async (req, res) => {
    try {
        const { username, isAdmin } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.username = username;
        user.isAdmin = !!isAdmin;
        user.updatedAt = new Date();
        
        await user.save();
        res.redirect('/admin');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Move general routes after specific routes
app.get('/admin/users', requireAdmin, async (req, res) => {
    const users = await User.find({ deletedAt: null });
    res.render('admin/users', { users });
});

app.post('/admin/users', requireAdmin, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    username,
    password: hashedPassword,
    isAdmin: !!isAdmin,
    createdAt: new Date()
  });
  res.redirect('/admin');
});

app.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
  res.sendStatus(200);
});

// Create Item
app.post('/admin/items', requireAdmin, async (req, res) => {
  try {
    const { name_en, name_kz, description_en, description_kz, images } = req.body;
    const imagesArray = images.split(',').map(url => url.trim()); // Split and trim URLs
    const newItem = new Item({
      name_en,
      name_kz,
      description_en,
      description_kz,
      images: imagesArray
    });
    await newItem.save();
    res.redirect('/admin/items');
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).send('Error creating item');
  }
});

// Get all items for admin
app.get('/admin/items', requireAdmin, async (req, res) => {
  try {
    const items = await Item.find({ deletedAt: null });
    res.render('admin-items', { items }); // Create a new view called admin-items.ejs
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).send('Error getting items');
  }
});

// Edit Item Form
app.get('/admin/items/edit/:id', requireAdmin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.redirect('/admin/items');
        }
        res.render('edit-item', { item }); // Create a new view called edit-item.ejs
    } catch (error) {
        console.error('Error loading item:', error);
        res.redirect('/admin/items');
    }
});

// Update Item
app.post('/admin/items/edit/:id', requireAdmin, async (req, res) => {
    try {
        const { name_en, name_kz, description_en, description_kz, images } = req.body;
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        item.name_en = name_en;
        item.name_kz = name_kz;
        item.description_en = description_en;
        item.description_kz = description_kz;
        item.images = images.split(',').map(url => url.trim()); // Split and trim URLs
        item.updatedAt = new Date();

        await item.save();
        res.redirect('/admin/items');
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete Item
app.delete('/admin/items/:id', requireAdmin, async (req, res) => {
  try {
    await Item.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('Error deleting item');
  }
});

// Auth routes
app.get('/', async (req, res) => {
  if (req.session && req.session.user) {
    try {
      const items = await Item.find({ deletedAt: null });
      res.render('index', { user: req.session.user, items: items }); // Pass items to the view
    } catch (error) {
      console.error('Error getting items:', error);
      res.render('index', { user: req.session.user, items: [] }); // Pass an empty array if there's an error
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/movies', requireAuth, (req, res) => {
  res.render('movies', { user: req.session.user });
});

app.get('/movie-quotes', requireAuth, (req, res) => {
  res.render('movie-quotes', { user: req.session.user });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});