import { Timetable } from '../models/Timetable.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Substitution } from '../models/Substitution.js';
import { Teacher } from '../models/Teacher.js';

export const getDayOfWeek = (dateStr) => {
  const dateObj = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dateObj.getDay()];
};

/**
 * Validates regular timetable entry before saving/updating
 */
export const checkTimetableConflict = async ({
  day,
  periodNumber,
  classId,
  teacherId,
  roomNumber,
  excludeId = null
}) => {
  const queryBase = { day, periodNumber };
  if (excludeId) {
    queryBase._id = { $ne: excludeId };
  }

  // 1. Check if class is already scheduled
  const classConflict = await Timetable.findOne({
    ...queryBase,
    classId
  })
    .populate('subjectId', 'name')
    .populate('teacherId', 'name');

  if (classConflict) {
    return {
      hasConflict: true,
      reason: `This class already has ${classConflict.subjectId?.name || 'a lecture'} with ${classConflict.teacherId?.name || 'a teacher'} during Period ${periodNumber} on ${day}.`
    };
  }

  // 2. Check if teacher is already teaching another class
  const teacherConflict = await Timetable.findOne({
    ...queryBase,
    teacherId
  })
    .populate('classId', 'className division')
    .populate('subjectId', 'name');

  if (teacherConflict) {
    const className = `${teacherConflict.classId?.className}-${teacherConflict.classId?.division}`;
    return {
      hasConflict: true,
      reason: `Teacher is already teaching Class ${className} (${teacherConflict.subjectId?.name || 'Subject'}) during Period ${periodNumber} on ${day}.`
    };
  }

  // 3. Check if room is already occupied
  if (roomNumber) {
    const roomConflict = await Timetable.findOne({
      ...queryBase,
      roomNumber: roomNumber.trim()
    }).populate('classId', 'className division');

    if (roomConflict) {
      const className = `${roomConflict.classId?.className}-${roomConflict.classId?.division}`;
      return {
        hasConflict: true,
        reason: `Room ${roomNumber} is already occupied by Class ${className} during Period ${periodNumber} on ${day}.`
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Validates substitute assignment in realtime
 */
export const checkSubstituteConflict = async ({
  date,
  periodNumber,
  substituteTeacherId,
  classId,
  excludeSubstitutionId = null
}) => {
  const teacher = await Teacher.findById(substituteTeacherId);
  if (!teacher || !teacher.isActive) {
    return {
      hasConflict: true,
      reason: 'The selected substitute teacher is either inactive or does not exist.'
    };
  }

  // 1. Check if teacher is marked absent on this date covering this period
  const absence = await TeacherAbsence.findOne({
    teacherId: substituteTeacherId,
    date,
    affectedPeriods: periodNumber
  });

  if (absence) {
    return {
      hasConflict: true,
      reason: `${teacher.name} is marked ABSENT on ${date} during Period ${periodNumber} (${absence.reason}).`
    };
  }

  // 2. Check if teacher has a regular scheduled class in timetable for this day & period
  const day = getDayOfWeek(date);
  const regularClass = await Timetable.findOne({
    day,
    periodNumber,
    teacherId: substituteTeacherId
  }).populate('classId', 'className division');

  if (regularClass) {
    const cls = `${regularClass.classId?.className}-${regularClass.classId?.division}`;
    return {
      hasConflict: true,
      reason: `${teacher.name} is already teaching Class ${cls} during Period ${periodNumber} on ${day}.`
    };
  }

  // 3. Check if teacher is already assigned as a substitute to another class during this date & period
  const subQuery = {
    date,
    periodNumber,
    substituteTeacherId,
    status: { $in: ['assigned', 'completed'] }
  };
  if (excludeSubstitutionId) {
    subQuery._id = { $ne: excludeSubstitutionId };
  }

  const existingSub = await Substitution.findOne(subQuery).populate('classId', 'className division');
  if (existingSub) {
    const cls = `${existingSub.classId?.className}-${existingSub.classId?.division}`;
    return {
      hasConflict: true,
      reason: `${teacher.name} is already assigned as substitute for Class ${cls} during Period ${periodNumber} on ${date}.`
    };
  }

  return { hasConflict: false };
};
