import mongoose from 'mongoose';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import { Timetable } from './backend/models/Timetable.js';
import { Subject } from './backend/models/Subject.js';
import { Teacher } from './backend/models/Teacher.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Timetable.countDocuments();
  console.log('Total timetable entries:', count);

  const subjects = await Subject.find({}, 'name marathiName');
  console.log('Subjects:', subjects.map(s => s.name));

  const freeEntries = await Timetable.find({
    $or: [
      { status: 'free' },
      { teacherId: null },
      { subjectId: null }
    ]
  });
  console.log('Entries with free/null teacher/subject:', freeEntries.length);

  // Check Monday period 1 entries
  const p1 = await Timetable.find({ day: 'Monday', periodNumber: 1 }).populate('classId teacherId subjectId');
  console.log('Monday Period 1 entries count:', p1.length);
  p1.forEach(e => {
    console.log(`Class: ${e.classId?.className}-${e.classId?.division}, Subject: ${e.subjectId?.name}, Teacher: ${e.teacherId?.name}`);
  });

  process.exit(0);
}

check();
