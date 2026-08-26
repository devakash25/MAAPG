import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

dotenv.config();
dotenvExpand.expand(dotenv.config());

import { User, Dealer } from './models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://devakash25:devakash25@cluster0.mhgzjxk.mongodb.net/maapg';

const seedUsers = [
  {
    email: 'admin@maapg.com',
    password: 'Admin@123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN' as const,
    phone: '9999999999',
  },
  {
    email: 'dealer@maapg.com',
    password: 'Dealer@123',
    firstName: 'Demo',
    lastName: 'Dealer',
    role: 'DEALER' as const,
    phone: '8888888888',
    dealer: {
      businessName: 'Demo Properties Pvt Ltd',
      businessTypes: ['HOTEL', 'PG', 'HOSTEL'],
      city: 'Mumbai',
      state: 'Maharashtra',
      businessPhone: '8888888888',
      businessEmail: 'dealer@maapg.com',
      businessAddress: '123 Demo Street, Mumbai',
      status: 'APPROVED' as const,
    },
  },
  {
    email: 'buyer@maapg.com',
    password: 'Buyer@123',
    firstName: 'Demo',
    lastName: 'Buyer',
    role: 'CUSTOMER' as const,
    phone: '7777777777',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of seedUsers) {
      const { dealer: dealerData, ...userInfo } = userData;

      const existing = await User.findOne({ email: userInfo.email });
      if (existing) {
        console.log(`User ${userInfo.email} already exists, skipping`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userInfo.password, 12);
      const user = await User.create({ ...userInfo, passwordHash });
      console.log(`Created user: ${userInfo.email} (${userInfo.role})`);

      if (dealerData) {
        await Dealer.create({
          userId: user._id,
          ...dealerData,
        });
        console.log(`Created dealer profile for: ${userInfo.email}`);
      }
    }

    console.log('\nSeed completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('  SuperAdmin: admin@maapg.com / Admin@123');
    console.log('  Dealer:     dealer@maapg.com / Dealer@123');
    console.log('  Buyer:      buyer@maapg.com / Buyer@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
