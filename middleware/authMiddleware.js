const jwt = require('jsonwebtoken');
const Token = require('../models/Token');

const authMiddleware = async (req, res, next) => {
  // Reduce logging in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Incoming headers:', req.headers);
    console.log('Incoming cookies:', req.cookies);
  }

  try {
    // Check multiple token sources
    let token = req.header('Authorization') || 
                req.cookies?.token || 
                req.signedCookies?.token;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Remove Bearer if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      clockTolerance: 30,
      algorithms: ['HS256'] // Specify algorithm
    });

    // Check token blacklist
    const blacklisted = await Token.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired',
        code: 'TOKEN_REVOKED'
      });
    }

    // Validate claims
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload',
        code: 'INVALID_PAYLOAD'
      });
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      token: token // Attach the token for potential refresh
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Handle other errors
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authMiddleware;