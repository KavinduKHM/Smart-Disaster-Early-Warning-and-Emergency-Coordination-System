import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_db';

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
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

async function registerDMCOfficer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'dmc.officer@disaster.lk';
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ email });
    if (existing) {
      existing.password = hashedPassword;
      existing.role = 'DMC_OFFICER';
      existing.name = 'DMC Officer Kamal';
      existing.district = 'Colombo';
      existing.badgeId = 'DMC-OFF-2026';
      await existing.save();
      console.log('✅ Updated existing DMC Officer account:', email);
    } else {
      const newUser = new User({
        name: 'DMC Officer Kamal',
        email,
        password: hashedPassword,
        role: 'DMC_OFFICER',
        district: 'Colombo',
        riverBasin: 'Kelani River Basin',
        phone: '0112345678',
        badgeId: 'DMC-OFF-2026',
      });
      await newUser.save();
      console.log('✅ Successfully registered new DMC Officer account:', email);
    }

    console.log('-------------------------------------------------------');
    console.log('DMC OFFICER LOGIN CREDENTIALS:');
    console.log('Email:    dmc.officer@disaster.lk');
    console.log('Password: Password123!');
    console.log('Role:     DMC_OFFICER');
    console.log('District: Colombo');
    console.log('-------------------------------------------------------');
  } catch (err) {
    console.error('Error registering DMC Officer:', err);
  } finally {
    await mongoose.disconnect();
  }
}

registerDMCOfficer();
