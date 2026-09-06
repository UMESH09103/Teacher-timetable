const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');

const verifyAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas...\n');

    // Verify / Reset Admin
    let admin = await Admin.findOne({ email: 'admin@school.com' }).select('+password');
    if (!admin) {
      admin = await Admin.create({
        name: 'Admin',
        email: 'admin@school.com',
        password: 'admin123'
      });
      console.log('✅ Created Admin account: admin@school.com / admin123');
    } else {
      admin.password = 'admin123';
      await admin.save();
      console.log('✅ Admin account verified & password reset to: admin123 (email: admin@school.com)');
    }

    // List all teachers
    const teachers = await Teacher.find().select('+password');
    console.log(`\n📋 Found ${teachers.length} teacher account(s) in MongoDB Atlas:`);
    teachers.forEach((t, i) => {
      console.log(` ${i + 1}. Email: "${t.email}" | Name: "${t.fullName}" | Status: ${t.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error verifying accounts:', err.message);
    process.exit(1);
  }
};

verifyAccounts();
