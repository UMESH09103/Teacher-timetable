const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Admin = require('../models/Admin');
const Standard = require('../models/Standard');
const Division = require('../models/Division');
const Settings = require('../models/Settings');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas Connected for initialization...');

    // Seed Admin
    let existingAdmin = await Admin.findOne({
      $or: [{ email: 'admin@school.com' }, { mobile: '7588097136' }]
    });
    if (!existingAdmin) {
      await Admin.create({
        name: 'Admin',
        email: 'admin@school.com',
        mobile: '7588097136',
        password: 'admin123'
      });
      console.log('✅ Admin initialized (admin@school.com / 7588097136 / admin123)');
    } else {
      existingAdmin.mobile = '7588097136';
      await existingAdmin.save();
      console.log('✅ Admin updated with mobile: 7588097136');
    }

    // Seed Standards (1-10)
    const stdMap = {};
    const standardNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    for (const name of standardNames) {
      let std = await Standard.findOne({ name });
      if (!std) {
        std = await Standard.create({ name });
      }
      stdMap[name] = std._id;
    }
    console.log('✅ Standards initialized (1-10)');

    // Seed Divisions (A-D)
    const divMap = {};
    const divisionNames = ['A', 'B', 'C', 'D'];
    for (const name of divisionNames) {
      let div = await Division.findOne({ name });
      if (!div) {
        div = await Division.create({ name });
      }
      divMap[name] = div._id;
    }
    console.log('✅ Divisions initialized (A-D)');

    // Seed Settings
    let existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        schoolName: 'माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर ता. येवला, जि. नाशिक',
        schoolLogo: '/school-logo.png',
        academicYear: '2026-2027'
      });
      console.log('✅ Default school settings created');
    } else {
      existingSettings.schoolName = 'माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर ता. येवला, जि. नाशिक';
      existingSettings.schoolLogo = '/school-logo.png';
      await existingSettings.save();
      console.log('✅ School settings verified with official school name and logo');
    }

    console.log('\n🎉 Clean initialization completed! Zero sample teachers or students.');
    console.log('📧 Admin Credentials: admin@school.com / admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
