const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Admin = require('../models/Admin');

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');

    let admin = await Admin.findOne({
      $or: [{ email: 'admin@school.com' }, { mobile: '7588097136' }]
    }).select('+password');

    if (!admin) {
      admin = await Admin.create({
        name: 'Admin',
        email: 'admin@school.com',
        mobile: '7588097136',
        password: 'admin123'
      });
      console.log('✅ Created new Admin (admin@school.com / 7588097136 / admin123)');
    } else {
      admin.email = 'admin@school.com';
      admin.mobile = '7588097136';
      admin.password = 'admin123';
      await admin.save();
      console.log('✅ Updated existing Admin (email: admin@school.com, mobile: 7588097136, password: admin123)');
    }

    const testMatch = await admin.matchPassword('admin123');
    console.log('🔑 Password match test for admin123:', testMatch);

    const findByMobile = await Admin.findOne({ mobile: '7588097136' });
    console.log('📱 Found admin by mobile 7588097136:', findByMobile ? findByMobile.email : 'NOT FOUND');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

fixAdmin();
