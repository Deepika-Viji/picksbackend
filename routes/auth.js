const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const Token = require('../models/Token'); 
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to: ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Check if user already exists (GET /check)
router.get('/check', async (req, res) => {
  const { username, email, tokenNumber } = req.query;
  try {
    const user = await User.findOne({
      $or: [{ username }, { email }, { tokenNumber }],  // Check if any of these fields already exist
    });
    if (user) {
      return res.json({ exists: true });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: 'Error checking duplicates' });
  }
});

// Register new user (POST /)
router.post('/', async (req, res) => {
  console.log('Registration endpoint hit');

  // Extract user details from the request body
  const { username, email, password, tokenNumber, role } = req.body;

  console.log('Raw password received:', password);  // Log raw password for debugging

  // Validate the input data
  if (!username || !email || !password || !tokenNumber || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if a user with the provided email or tokenNumber already exists
    let userExists = await User.findOne({ $or: [{ email }, { tokenNumber }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or tokenNumber already exists' });
    }

    // Check if the password is already hashed
    if (password.startsWith('$2a$')) {
      return res.status(400).json({ error: 'Password cannot be already hashed' });
    }

    // Hash the password if it’s not already hashed
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Hashed password during registration:', hashedPassword);  // Log hashed password

    // Create a new user in the database
    const newUser = new User({
      username,
      email,
      password: hashedPassword,  // Store the hashed password
      role,
      tokenNumber,  // Add the tokenNumber here
    });

    // Save the new user in the database
    await newUser.save();

    // Send a success response
    res.status(201).json({ message: 'User created successfully', newUser });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        username: decoded.username,
        role: decoded.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Login route (POST /login)
router.post('/login', async (req, res) => {
  console.log('Login route hit - request body:', req.body);
  console.log('Headers:', req.headers);
  
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    console.log('Missing fields - loginIdentifier:', loginIdentifier, 'password:', password);
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ $or: [{ username: loginIdentifier }, { email: loginIdentifier }] });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username/email or password' });
    }

    const enteredPassword = password.trim();
    const isMatch = await bcrypt.compare(enteredPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username/email or password' });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        email: user.email, 
        tokenNumber: user.tokenNumber,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIE === 'true',
      sameSite: process.env.SAME_SITE || 'none',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
      path: '/'
    });

    // Also send token in response for clients that need it
    res.status(200).json({
      token,
      user: {
        username: user.username,
        tokenNumber: user.tokenNumber,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      await Token.create({
        token,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
      });
    }
    
    // Clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.SECURE_COOKIE === 'true',
      sameSite: process.env.SAME_SITE || 'none',
      domain: process.env.COOKIE_DOMAIN,
      path: '/'
    });
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

router.get('/verify', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) return res.status(401).json({ valid: false });
  
  try {
    // Check if token is blacklisted
    const blacklisted = await Token.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ valid: false });
    }

    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Get all users with pagination and search filter (GET /api/users/all)
router.get('/all', async (req, res) => {
  const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 10;  // Default to 10 records per page if not provided
  const searchTerm = req.query.searchTerm || '';  // Get search term if provided

  const skip = (page - 1) * limit;  // Calculate the number of records to skip

  try {
    const query = searchTerm
      ? {
          $or: [
            { username: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { tokenNumber: { $regex: searchTerm, $options: 'i' } },
            { role: { $regex: searchTerm, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .skip(skip)
      .limit(limit);  // Apply pagination to the query

    const totalUsers = await User.countDocuments(query);  // Get the total number of users matching search term

    const totalPages = Math.ceil(totalUsers / limit);  // Calculate total pages

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Get user by ID (GET /api/users/:id)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Update user by ID (PUT /api/users/:id)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, role, password, tokenNumber } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.tokenNumber = tokenNumber || user.tokenNumber;  // Add the tokenNumber field

    // If password is provided, hash it and update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete user by ID (DELETE /api/users/:id)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;