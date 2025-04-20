const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware'); // Import the authMiddleware
const router = express.Router();

// Existing route to check if user exists
router.get('/check', async (req, res) => {
  const { username, email, tokenNumber } = req.query;
  try {
    const user = await User.findOne({
      $or: [{ username }, { email }, { tokenNumber }],
    });
    if (user) {
      return res.json({ exists: true });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: 'Error checking duplicates' });
  }
});

// Registration route (POST /)
router.post('/', async (req, res) => {
  const { username, email, password, tokenNumber, role } = req.body;

  if (!username || !email || !password || !tokenNumber || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    let userExists = await User.findOne({ $or: [{ email }, { tokenNumber }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or tokenNumber already exists' });
    }

    if (password.startsWith('$2a$')) {
      return res.status(400).json({ error: 'Password cannot be already hashed' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      tokenNumber,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully', newUser });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route (POST /login)
router.post('/login', async (req, res) => {
  const { loginIdentifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(), // Ensure string conversion
        username: user.username,
        role: user.role,
        tokenNumber: user.tokenNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // Increased from 1h for testing
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tokenNumber: user.tokenNumber
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

// Get current user info (GET /me)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination and search (GET /api/users/all)
router.get('/all', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const searchQuery = req.query.searchTerm || '';  // Optional search term

  try {
    // Build query for search
    const query = {
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { tokenNumber: { $regex: searchQuery, $options: 'i' } },
        { role: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // Fetch users based on search query and pagination
    const users = await User.find(query).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(query);  // Count users after filtering
    const totalPages = Math.ceil(totalUsers / limit);

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

    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.tokenNumber = tokenNumber || user.tokenNumber;

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
