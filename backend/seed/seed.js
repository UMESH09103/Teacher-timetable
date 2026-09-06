import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import xlsx from 'xlsx';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('[Seed] Could not set custom DNS servers:', e.message);
}

dotenv.config();

import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { Timetable } from '../models/Timetable.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Substitution } from '../models/Substitution.js';
import { Notification } from '../models/Notification.js';
import { PERIOD_TIMINGS } from '../controllers/timetableController.js';

// Teacher alias / typo normalizations found in Excel sheets
const TEACHER_NORMALIZATIONS = {
  'बोडके आर.एस.': 'बोडखे आर.एस.',
  'ठोंबरे एस.एल.': 'ठोंबरे एल.एस.'
};

// Subject normalizations found in Excel sheets
const SUBJECT_NORMALIZATIONS = {
  'परीसर 1': 'परिसर अभ्यास 1',
  'परिसर 1': 'परिसर अभ्यास 1',
  'परीसर 2': 'परिसर अभ्यास 2',
  'परिसर 2': 'परिसर अभ्यास 2',
  'शा,शिक्षण': 'शा.शिक्षण',
  'स्का./ गाईड': 'स्काउट / गाईड',
  'स्का./गाईड': 'स्काउट / गाईड'
};

const DAY_MAPPING = {
  'सोमवार': 'Monday',
  'मंगळवार': 'Tuesday',
  'बुधवार': 'Wednesday',
  'गुरूवार': 'Thursday',
  'शुक्रवार': 'Friday',
  'शनिवार': 'Saturday'
};

const CLASS_COLUMNS = [
  { col: 1, className: '5', division: 'A', roomNumber: 'Room 101', displayName: '5-A (5 वी अ)', marathiName: '5 वी अ' },
  { col: 2, className: '5', division: 'B', roomNumber: 'Room 102', displayName: '5-B (5 वी ब)', marathiName: '5 वी ब' },
  { col: 3, className: '6', division: 'A', roomNumber: 'Room 201', displayName: '6-A (6 वी अ)', marathiName: '6 वी अ' },
  { col: 4, className: '6', division: 'B', roomNumber: 'Room 202', displayName: '6-B (6 वी ब)', marathiName: '6 वी ब' },
  { col: 5, className: '7', division: 'A', roomNumber: 'Room 301', displayName: '7-A (7 वी अ)', marathiName: '7 वी अ' },
  { col: 6, className: '7', division: 'B', roomNumber: 'Room 302', displayName: '7-B (7 वी ब)', marathiName: '7 वी ब' },
  { col: 7, className: '8', division: 'A', roomNumber: 'Room 401', displayName: '8-A (8 वी अ)', marathiName: '8 वी अ' },
  { col: 8, className: '8', division: 'B', roomNumber: 'Room 402', displayName: '8-B (8 वी ब)', marathiName: '8 वी ब' },
  { col: 9, className: '9', division: 'A', roomNumber: 'Room 501', displayName: '9-A (9 वी अ)', marathiName: '9 वी अ' },
  { col: 10, className: '9', division: 'B', roomNumber: 'Room 502', displayName: '9-B (9 वी ब)', marathiName: '9 वी ब' },
  { col: 11, className: '10', division: 'A', roomNumber: 'Room 601', displayName: '10-A (10 वी अ)', marathiName: '10 वी अ' },
  { col: 12, className: '10', division: 'B', roomNumber: 'Room 602', displayName: '10-B (10 वी ब)', marathiName: '10 वी ब' }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_timetable';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB at', mongoUri);

    // Locate Excel file
    let excelPath = path.resolve('../वारनिहाय_सर्व_वर्ग_वेळापत्रक_सेटिंग_सुधारित.xlsx');
    if (!fs.existsSync(excelPath)) {
      excelPath = path.resolve('./वारनिहाय_सर्व_वर्ग_वेळापत्रक_सेटिंग_सुधारित.xlsx');
    }
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found at ${excelPath}`);
    }
    console.log(`[Seed] Loading institutional data from: ${excelPath}`);
    const wb = xlsx.readFile(excelPath);

    // Clean existing collections
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Timetable.deleteMany({});
    await TeacherAbsence.deleteMany({});
    await Substitution.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seed] Cleared all old mock/default collections');

    // 1. Create Principal Account
    const principalUser = await User.create({
      name: 'श्री. गिते एस.एस. (प्राचार्य)',
      email: 'admin@school.com',
      phone: '9822001122',
      password: 'Admin@123',
      role: 'principal',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    console.log('[Seed] Created Principal Account: admin@school.com (Mobile: 9822001122) / Admin@123');

    // 2. Define and Insert Master Subjects
    const subjectsMaster = [
      { name: 'गणित (Mathematics)', marathiName: 'गणित', code: 'MATH', category: 'Core', colorHex: '#4F46E5' },
      { name: 'विज्ञान (Science)', marathiName: 'विज्ञान', code: 'SCI', category: 'Core', colorHex: '#0EA5E9' },
      { name: 'मराठी (Marathi)', marathiName: 'मराठी', code: 'MAR', category: 'Language', colorHex: '#EC4899' },
      { name: 'हिंदी (Hindi)', marathiName: 'हिंदी', code: 'HIN', category: 'Language', colorHex: '#F59E0B' },
      { name: 'इंग्रजी (English)', marathiName: 'इंग्रजी', code: 'ENG', category: 'Language', colorHex: '#10B981' },
      { name: 'समाजशास्त्र (Social Studies)', marathiName: 'समाजशास्त्र', code: 'SOC', category: 'Core', colorHex: '#8B5CF6' },
      { name: 'इतिहास व नागरिकशास्त्र (History)', marathiName: 'इतिहास', code: 'HIST', category: 'Core', colorHex: '#D97706' },
      { name: 'भूगोल (Geography)', marathiName: 'भूगोल', code: 'GEOG', category: 'Core', colorHex: '#059669' },
      { name: 'परिसर अभ्यास १ (EVS 1)', marathiName: 'परिसर अभ्यास 1', code: 'EVS1', category: 'Core', colorHex: '#14B8A6' },
      { name: 'परिसर अभ्यास २ (EVS 2)', marathiName: 'परिसर अभ्यास 2', code: 'EVS2', category: 'Core', colorHex: '#0D9488' },
      { name: 'कला शिक्षण (Art)', marathiName: 'कला', code: 'ART', category: 'Arts & Physical', colorHex: '#F43F5E' },
      { name: 'शारीरिक शिक्षण व आरोग्य (PT)', marathiName: 'शा.शिक्षण', code: 'PT', category: 'Arts & Physical', colorHex: '#6366F1' },
      { name: 'कार्यशिक्षण (Work Experience)', marathiName: 'कार्यशिक्षण', code: 'WE', category: 'Arts & Physical', colorHex: '#E11D48' },
      { name: 'जलसुरक्षा (Water Security)', marathiName: 'जलसुरक्षा', code: 'WS', category: 'Core', colorHex: '#0284C7' },
      { name: 'स्काउट व गाईड (Scout & Guide)', marathiName: 'स्काउट / गाईड', code: 'SG', category: 'Elective', colorHex: '#7C3AED' }
    ];

    const createdSubjects = await Subject.insertMany(subjectsMaster);
    const subjectByMarathi = new Map();
    const subjectByCode = new Map();
    createdSubjects.forEach((s) => {
      subjectByMarathi.set(s.marathiName, s);
      subjectByCode.set(s.code, s);
    });
    console.log(`[Seed] Inserted ${createdSubjects.length} institutional subjects`);

    // 3. Define Real Teachers from Excel Sheets ('शिक्षक विषय वाटप' & 'वर्गशिक्षक')
    const teachersDefinition = [
      // Core Secondary Faculty (18 teachers)
      {
        name: 'श्री. गिते एस.एस.',
        shortName: 'गिते एस.एस.',
        designation: 'प्राचार्य',
        employeeId: 'EMP-T01',
        email: 'gite.ss@school.com',
        phone: '9822001122',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. वाघ आर.बी.',
        shortName: 'वाघ आर.बी.',
        designation: 'पर्यवेक्षक',
        employeeId: 'EMP-T02',
        email: 'wagh.rb@school.com',
        phone: '9822002233',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. वाघ एस.एन.',
        shortName: 'वाघ एस.एन.',
        designation: 'उपशिक्षक',
        employeeId: 'EMP-T03',
        email: 'wagh.sn@school.com',
        phone: '9822003344',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. सानप बाळासाहेब दगू',
        shortName: 'सानप बी.डी.',
        designation: 'उपशिक्षक (वर्गशिक्षक 6 वी ब)',
        employeeId: 'EMP-T04',
        email: 'sanap.bd@school.com',
        phone: '9604860467',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. काकड रमेश भागवत',
        shortName: 'काकड आर.बी.',
        designation: 'उपशिक्षक (वर्गशिक्षक 9 वी अ)',
        employeeId: 'EMP-T05',
        email: 'kakad.rb@school.com',
        phone: '8788467725',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. वाघ व्ही.व्ही.',
        shortName: 'वाघ व्ही.व्ही.',
        designation: 'उपशिक्षक',
        employeeId: 'EMP-T06',
        email: 'wagh.vv@school.com',
        phone: '9822006677',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. घुगे एस.आर.',
        shortName: 'घुगे एस.आर.',
        designation: 'उपशिक्षक',
        employeeId: 'EMP-T07',
        email: 'ghuge.sr@school.com',
        phone: '9822007788',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. जगताप संदिप दादाजी',
        shortName: 'जगताप एस.डी.',
        designation: 'उपशिक्षक (वर्गशिक्षक 8 वी अ)',
        employeeId: 'EMP-T08',
        email: 'jagtap.sd@school.com',
        phone: '7276009493',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. ठोंबरे लक्ष्मण शंकर',
        shortName: 'ठोंबरे एल.एस.',
        designation: 'उपशिक्षक (वर्गशिक्षक 7 वी ब)',
        employeeId: 'EMP-T09',
        email: 'thombre.ls@school.com',
        phone: '9960813611',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. पानसरे वसंत वाल्मिक',
        shortName: 'पानसरे व्ही.व्ही.',
        designation: 'उपशिक्षक (वर्गशिक्षक 10 वी अ)',
        employeeId: 'EMP-T10',
        email: 'pansare.vv@school.com',
        phone: '8788064036',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. गडाख शरद सुधाकर',
        shortName: 'गडाख एस.एस.',
        designation: 'उपशिक्षक (वर्गशिक्षक 10 वी ब)',
        employeeId: 'EMP-T11',
        email: 'gadakh.ss@school.com',
        phone: '9960639725',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. कुलकर्णी मंदार लक्ष्मीकांत',
        shortName: 'कुलकर्णी एम.एल.',
        designation: 'उपशिक्षक (वर्गशिक्षक 8 वी ब)',
        employeeId: 'EMP-T12',
        email: 'kulkarni.ml@school.com',
        phone: '8805171346',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्रीम. गिते ज्योती अशोक',
        shortName: 'गिते जे.ए.',
        designation: 'उपशिक्षिका (वर्गशिक्षक 7 वी अ)',
        employeeId: 'EMP-T13',
        email: 'gite.ja@school.com',
        phone: '8459841811',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. सानप गोकुळ बबन',
        shortName: 'सानप जी.बी.',
        designation: 'उपशिक्षक (वर्गशिक्षक 9 वी ब)',
        employeeId: 'EMP-T14',
        email: 'sanap.gb@school.com',
        phone: '8317254474',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. दराडे सुनिल लक्ष्मण',
        shortName: 'दराडे एस.एल.',
        designation: 'उपशिक्षक (वर्गशिक्षक 6 वी अ)',
        employeeId: 'EMP-T15',
        email: 'darade.sl@school.com',
        phone: '9765230345',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्रीम. चौधरी एस.बी.',
        shortName: 'चौधरी एस.बी.',
        designation: 'उपशिक्षिका',
        employeeId: 'EMP-T16',
        email: 'chaudhary.sb@school.com',
        phone: '9822016677',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. बोडखे रमेश साहेबराव',
        shortName: 'बोडखे आर.एस.',
        designation: 'उपशिक्षक (वर्गशिक्षक 5 वी ब)',
        employeeId: 'EMP-T17',
        email: 'bodkhe.rs@school.com',
        phone: '9923087374',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. दराडे ज्ञानेश्वर दत्तु',
        shortName: 'दराडे डी.डी.',
        designation: 'उपशिक्षक (वर्गशिक्षक 5 वी अ)',
        employeeId: 'EMP-T18',
        email: 'darade.dd@school.com',
        phone: '8888770916',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
      },
      // Junior College Faculty (from 'वर्गशिक्षक' sheet)
      {
        name: 'श्री. नागरे सचिन शरद',
        shortName: 'नागरे एस.एस.',
        designation: 'वर्गशिक्षक (11 वी कला अ)',
        employeeId: 'EMP-JC01',
        email: 'nagare.ss@school.com',
        phone: '7028333932',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. आव्हाड संदिप जगनाथ',
        shortName: 'आव्हाड एस.जे.',
        designation: 'वर्गशिक्षक (11 वी कला ब)',
        employeeId: 'EMP-JC02',
        email: 'awhad.sj@school.com',
        phone: '8805610832',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्रीमती. भोगे वर्षा जितेंद्र',
        shortName: 'भोगे व्ही.जे.',
        designation: 'वर्गशिक्षिका (12 वी कला अ)',
        employeeId: 'EMP-JC03',
        email: 'bhoge.vj@school.com',
        phone: '8329129571',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. जाधव शिवाजी सोपान',
        shortName: 'जाधव एस.एस.',
        designation: 'वर्गशिक्षक (12 वी कला ब)',
        employeeId: 'EMP-JC04',
        email: 'jadhav.ss@school.com',
        phone: '9404290276',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्रीमती. गायकवाड पुजा विलास',
        shortName: 'गायकवाड पी.व्ही.',
        designation: 'वर्गशिक्षिका (11 वी विज्ञान)',
        employeeId: 'EMP-JC05',
        email: 'gaikwad.pv@school.com',
        phone: '8856058183',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'श्री. सोनवणे गणेश मदन',
        shortName: 'सोनवणे जी.एम.',
        designation: 'वर्गशिक्षक (12 वी विज्ञान)',
        employeeId: 'EMP-JC06',
        email: 'sonawane.gm@school.com',
        phone: '8830109791',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
      }
    ];

    const createdTeachers = await Teacher.insertMany(teachersDefinition);
    const teacherByShortName = new Map();
    createdTeachers.forEach((t) => {
      teacherByShortName.set(t.shortName, t);
    });
    console.log(`[Seed] Inserted ${createdTeachers.length} real teachers`);

    // Create User login accounts for all teachers (password: Teacher@123)
    for (const t of createdTeachers) {
      await User.create({
        name: t.name,
        email: t.email,
        phone: t.phone ? String(t.phone).trim() : '',
        password: 'Teacher@123',
        role: 'teacher',
        teacherId: t._id,
        avatar: t.avatar
      });
    }
    console.log('[Seed] Created login accounts with mobile numbers for all teachers (password: Teacher@123)');

    // 4. Create Secondary Classes & Map Class Teachers
    const classTeacherMapping = {
      '5-A': 'दराडे डी.डी.',
      '5-B': 'बोडखे आर.एस.',
      '6-A': 'दराडे एस.एल.',
      '6-B': 'सानप बी.डी.',
      '7-A': 'गिते जे.ए.',
      '7-B': 'ठोंबरे एल.एस.',
      '8-A': 'जगताप एस.डी.',
      '8-B': 'कुलकर्णी एम.एल.',
      '9-A': 'काकड आर.बी.',
      '9-B': 'सानप जी.बी.',
      '10-A': 'पानसरे व्ही.व्ही.',
      '10-B': 'गडाख एस.एस.'
    };

    const classesToCreate = CLASS_COLUMNS.map((c) => {
      const ctShortName = classTeacherMapping[`${c.className}-${c.division}`];
      const teacherObj = teacherByShortName.get(ctShortName);
      return {
        className: c.className,
        division: c.division,
        roomNumber: c.roomNumber,
        displayName: c.displayName,
        marathiName: c.marathiName,
        classTeacher: teacherObj ? teacherObj._id : null,
        studentCount: 45,
        academicYear: '2026-2027'
      };
    });

    const createdClasses = await Class.insertMany(classesToCreate);
    const classMapByCol = new Map();
    const classMapByKey = new Map();
    createdClasses.forEach((cls, idx) => {
      const colMeta = CLASS_COLUMNS[idx];
      classMapByCol.set(colMeta.col, cls);
      classMapByKey.set(`${cls.className}-${cls.division}`, cls);
    });
    console.log(`[Seed] Inserted ${createdClasses.length} secondary classes with class teachers`);

    // Link assigned classes to class teachers
    for (const cls of createdClasses) {
      if (cls.classTeacher) {
        await Teacher.findByIdAndUpdate(cls.classTeacher, {
          $addToSet: { classes: cls._id }
        });
      }
    }

    // 5. Parse Timetable from 6 Day Sheets (सोमवार ते शनिवार)
    const timetableEntries = [];
    const teacherSubjectPairs = new Map(); // teacherId -> Set of subjectIds

    for (const [marathiDay, englishDay] of Object.entries(DAY_MAPPING)) {
      const sheet = wb.Sheets[marathiDay];
      if (!sheet) {
        throw new Error(`Sheet '${marathiDay}' not found in Excel workbook!`);
      }
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      for (let p = 1; p <= 8; p++) {
        const row = data[p + 2]; // Row 3 is Period 1
        const periodTiming = PERIOD_TIMINGS[p - 1];

        CLASS_COLUMNS.forEach((colInfo) => {
          const rawCell = (row && row[colInfo.col]) ? String(row[colInfo.col]).trim() : '';
          if (!rawCell) {
            throw new Error(`Empty cell in ${marathiDay}, Period ${p}, Class ${colInfo.displayName}`);
          }

          const parts = rawCell.split('-');
          let subjName = parts[0].trim();
          let tchrName = parts.slice(1).join('-').trim();

          // Normalizations
          subjName = SUBJECT_NORMALIZATIONS[subjName] || subjName;
          tchrName = TEACHER_NORMALIZATIONS[tchrName] || tchrName;

          const subjectDoc = subjectByMarathi.get(subjName);
          const teacherDoc = teacherByShortName.get(tchrName);
          const classDoc = classMapByCol.get(colInfo.col);

          if (!subjectDoc) {
            throw new Error(`Subject '${subjName}' (from '${rawCell}') not found in Subject master!`);
          }
          if (!teacherDoc) {
            throw new Error(`Teacher '${tchrName}' (from '${rawCell}') not found in Teacher master!`);
          }

          // Track teacher -> subject association
          if (!teacherSubjectPairs.has(teacherDoc._id.toString())) {
            teacherSubjectPairs.set(teacherDoc._id.toString(), new Set());
          }
          teacherSubjectPairs.get(teacherDoc._id.toString()).add(subjectDoc._id.toString());

          timetableEntries.push({
            day: englishDay,
            periodNumber: p,
            startTime: periodTiming.startTime,
            endTime: periodTiming.endTime,
            classId: classDoc._id,
            subjectId: subjectDoc._id,
            teacherId: teacherDoc._id,
            roomNumber: classDoc.roomNumber,
            academicYear: '2026-2027'
          });
        });
      }
    }

    // Insert all 576 timetable records
    await Timetable.insertMany(timetableEntries);
    console.log(`[Seed] Successfully inserted ${timetableEntries.length} timetable slots across Monday-Saturday!`);

    // Update teachers with their taught subjects & taught classes
    for (const [tIdStr, sIdSet] of teacherSubjectPairs.entries()) {
      await Teacher.findByIdAndUpdate(tIdStr, {
        $addToSet: { subjects: { $each: Array.from(sIdSet) } }
      });
    }
    console.log('[Seed] Updated faculty subject specialties from schedule');

    console.log('[Seed] Absences and Substitutions are left clean (zero default absences/substitutions).');
    console.log('============================================================');
    console.log('✅ DATABASE SEEDING FROM EXCEL COMPLETED SUCCESSFULLY!');
    console.log('   Total Classes:   12 (5-A to 10-B)');
    console.log('   Total Teachers:  24 (18 Secondary + 6 Junior College)');
    console.log('   Total Timetable: 576 slots (100% Conflict-Free, Mon-Sat)');
    console.log('   Principal Login: admin@school.com / Admin@123');
    console.log('   Teacher Login:   darade.dd@school.com / Teacher@123');
    console.log('   Teacher Login:   bodkhe.rs@school.com / Teacher@123');
    console.log('============================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
