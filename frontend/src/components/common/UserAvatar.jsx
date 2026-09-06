import React from 'react';

/**
 * Checks whether a user or teacher is female based on gender, title, or designation
 */
export const isFemaleUser = (person) => {
  if (!person) return false;
  if (typeof person === 'string') {
    const s = person.toLowerCase();
    return (
      s.includes('श्रीम') ||
      s.includes('श्रीमती') ||
      s.includes('सौ.') ||
      s.includes('कु.') ||
      s.includes('शिक्षिका') ||
      s.includes('प्राचार्या') ||
      s.includes('पर्यवेक्षिका') ||
      s.includes('mrs') ||
      s.includes('ms.') ||
      s.includes('miss') ||
      s.includes('female')
    );
  }

  if (person.gender === 'female') return true;
  if (person.gender === 'male') return false;

  const combined = `${person.name || ''} ${person.shortName || ''} ${person.designation || ''}`.toLowerCase();
  return (
    combined.includes('श्रीम') ||
    combined.includes('श्रीमती') ||
    combined.includes('सौ.') ||
    combined.includes('कु.') ||
    combined.includes('शिक्षिका') ||
    combined.includes('प्राचार्या') ||
    combined.includes('पर्यवेक्षिका') ||
    combined.includes('mrs') ||
    combined.includes('ms.') ||
    combined.includes('miss') ||
    combined.includes('female')
  );
};

export const getAvatarSrc = (person) => {
  return isFemaleUser(person) ? '/avatars/female.svg' : '/avatars/male.svg';
};

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20'
};

export const UserAvatar = ({
  user,
  name,
  gender,
  designation,
  size = 'md',
  className = '',
  ring = true,
  alt = 'Avatar'
}) => {
  const person = user || { name, gender, designation };
  const isFemale = isFemaleUser(person);
  const src = isFemale ? '/avatars/female.svg' : '/avatars/male.svg';
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const ringClass = ring
    ? 'ring-2 ring-slate-200/90 dark:ring-slate-700/90 bg-white dark:bg-slate-900'
    : 'bg-white dark:bg-slate-900';

  return (
    <img
      src={src}
      alt={alt || (person?.name ? `${person.name} Avatar` : (isFemale ? 'Female Avatar' : 'Male Avatar'))}
      className={`${sizeClass} rounded-full object-contain p-0.5 shrink-0 select-none shadow-xs ${ringClass} ${className}`}
      loading="lazy"
    />
  );
};

export default UserAvatar;
