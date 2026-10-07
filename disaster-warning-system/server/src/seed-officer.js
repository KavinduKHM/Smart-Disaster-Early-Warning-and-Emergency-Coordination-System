const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uris = [
  process.env.MONGODB_URI,
  'mongodb://127.0.0.1:27017/disaster_db',
  'mongodb://localhost:27017/disaster_db',
].filter(Boolean);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['DMC_OFFICER', 'DUTY_OFFICER', 'DISTRICT_OFFICER', 'RESCUE_TEAM', 'SHELTER_MANAGER', 'VOLUNTEER', 'CITIZEN', 'ADMIN'],
      default: 'CITIZEN',
    },
    district: { type: String, default: 'Colombo' },
    riverBasin: { type: String, default: '' },
    phone: { type: String, default: '' },
    badgeId: { type: String, default: '' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

async function run() {
  let connected = false;

  for (const uri of uris) {
    try {
      console.log(`Connecting to MongoDB (${uri.substring(0, 30)}...)...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`Connected successfully to ${uri}!`);
      connected = true;
      break;
    } catch (err) {
      console.warn(`Failed to connect to ${uri}: ${err.message}`);
    }
  }

  if (!connected) {
    console.error('Could not connect to any MongoDB instance. Exiting.');
    process.exit(1);
  }

  const email = 'dmc.officer@disaster.lk';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { email },
    {
      name: 'DMC Officer Kamal',
      email,
      password: hashedPassword,
      role: 'DMC_OFFICER',
      district: 'Colombo',
      riverBasin: 'Kelani River Basin',
      phone: '0112345678',
      badgeId: 'DMC-OFF-2026',
    },
    { upsert: true, new: true }
  );

  console.log('=======================================================');
  console.log('✅ DMC OFFICER REGISTERED SUCCESSFULLY IN SYSTEM');
  console.log('Name:    ', user.name);
  console.log('Email:   ', user.email);
  console.log('Password:', 'Password123!');
  console.log('Role:    ', user.role);
  console.log('District:', user.district);
  console.log('Badge ID:', user.badgeId);
  console.log('=======================================================');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
