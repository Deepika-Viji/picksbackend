const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // Required for password hashing

// Regular expression for email validation
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [emailRegex, 'Please enter a valid email address'],  // Email validation
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['User', 'Admin', 'SuperAdmin'],  // Role validation
  },
  tokenNumber: {  // Token number field (replacing phoneNumber)
    type: String,
    required: true,  // Make sure it's set when creating/updating users
    unique: true,  // Ensure the tokenNumber is unique
  },
}, {
  timestamps: true,
});

// Pre-save hook to hash password if it's updated
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.password.startsWith('$2a$')) return next();  // Skip hashing if already hashed

  try {
    console.log('Password before hashing:', this.password);  // Log raw password

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    console.log('Password after hashing:', this.password);  // Log hashed password
    next();
  } catch (error) {
    console.error('Error during password hashing:', error);
    next(error);
  }
});

// Method to exclude password from responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;  // Exclude password
  return user;
};

// Method to check if the entered password matches the stored hashed password
userSchema.methods.isPasswordMatch = async function (enteredPassword) {
  const match = await bcrypt.compare(enteredPassword, this.password);
  console.log('Entered Password:', enteredPassword);  // Log the plain-text password
  console.log('Hashed Password:', this.password);  // Log the hashed password
  console.log('Do passwords match?', match);  // Log whether passwords match
  return match;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
