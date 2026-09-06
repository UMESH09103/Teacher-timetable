import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_school_timetable_key_2026_x89!', {
    expiresIn: '30d'
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, phone, mobile, identifier, password } = req.body;
    const input = (identifier || email || phone || mobile || '').trim();

    if (!input || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or mobile number, and password'
      });
    }

    // Clean digits for 10-digit mobile lookup (e.g. +91 8888770916 -> 8888770916)
    const cleanDigits = input.replace(/\D/g, '').slice(-10);
    const isDigitsOnly = /^\d{10}$/.test(cleanDigits);

    const userConditions = [
      { email: input.toLowerCase() }
    ];

    if (isDigitsOnly) {
      userConditions.push({ phone: cleanDigits });
      userConditions.push({ phone: input });
      userConditions.push({ phone: new RegExp(cleanDigits + '$') });
    } else if (input.length >= 7) {
      userConditions.push({ phone: input });
    }

    let user = await User.findOne({ $or: userConditions }).populate({
      path: 'teacherId',
      populate: [
        { path: 'subjects', select: 'name code colorHex marathiName' },
        { path: 'classes', select: 'className division roomNumber displayName marathiName' }
      ]
    });

    // Fallback: If user not found directly, check if Teacher document has this phone number
    if (!user && isDigitsOnly) {
      const teacher = await Teacher.findOne({
        $or: [
          { phone: cleanDigits },
          { phone: input },
          { phone: new RegExp(cleanDigits + '$') }
        ]
      });

      if (teacher) {
        user = await User.findOne({
          $or: [
            { teacherId: teacher._id },
            { email: teacher.email }
          ]
        }).populate({
          path: 'teacherId',
          populate: [
            { path: 'subjects', select: 'name code colorHex marathiName' },
            { path: 'classes', select: 'className division roomNumber displayName marathiName' }
          ]
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User account not found with this email or mobile number.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.teacherId?.phone || '',
        role: user.role,
        avatar: user.avatar,
        teacherId: user.teacherId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate({
      path: 'teacherId',
      populate: [
        { path: 'subjects', select: 'name code colorHex' },
        { path: 'classes', select: 'className division roomNumber' }
      ]
    });

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
