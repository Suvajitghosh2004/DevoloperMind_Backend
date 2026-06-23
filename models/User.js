const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  // select:false keeps password out of normal queries; auth routes use .select('+password')
  password: { type: String, required: true, minlength: 6, select: false },
  role:    { type: String, enum: ['admin', 'editor'], default: 'admin' },
  avatar:  { type: String },
  bio:     { type: String, maxlength: 300 },
  socialLinks: {
    twitter:  String,
    github:   String,
    linkedin: String
  },
  refreshToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Hash password only when it has actually changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
