const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Ensures an admin account exists matching ADMIN_EMAIL / ADMIN_PASSWORD in .env.
 * - If no user with that email exists, creates one.
 * - If the user exists but the .env password no longer matches the stored hash,
 *   updates the password to match .env (so changing .env + restarting the
 *   server is the supported way to change the admin password).
 * Runs once on every server boot, after MongoDB connects.
 */
async function seedAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping admin auto-provisioning.');
    return;
  }

  if (password.length < 6) {
    console.warn('⚠️  ADMIN_PASSWORD must be at least 6 characters — skipping admin auto-provisioning.');
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!existing) {
    await User.create({ name, email, password, role: 'admin' });
    console.log(`✅ Admin account created from .env: ${email}`);
    return;
  }

  // Keep the stored password in sync with .env, so editing .env + restarting
  // updates credentials without ever calling an API route by hand.
  const matches = await bcrypt.compare(password, existing.password);
  if (!matches) {
    existing.password = password; // pre-save hook re-hashes it
    existing.name = name;
    await existing.save();
    console.log(`🔁 Admin password updated from .env for: ${email}`);
  } else {
    console.log(`✅ Admin account verified: ${email}`);
  }
}

module.exports = seedAdminFromEnv;
