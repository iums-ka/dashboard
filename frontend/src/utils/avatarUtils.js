/**
 * Avatar Utilities
 * 
 * Helper functions for resolving user avatars.
 * Currently uses a hardcoded map - TODO: Replace with backend API.
 */

// TODO: TEMPORARY MOCK - Replace with backend API call to /api/users/with-avatars
// Mock user avatar mapping - maps display names to local avatar files in /public
export const USER_AVATAR_MAP = {
  'ethan': '/avatar.ethan.png',
  'jonas': '/avatar.jonas.jpg',
  'leon': '/avatar.leon.png',
  'lukas': '/avatar.lukas.png',
  'marie': '/avatar.marie.png',
  'marit': '/avatar.marit.png',
  'riem': '/avatar.riem.png',
  'thomas': '/avatar.thomas.png',
  'waldemar': '/avatar.waldemar.png',
  'blanche': '/avatar.blanche.jpg',
  'bastian': '/avatar.bastian.png',
  'dilara': '/avatar.dilara.png',
  'melanie': '/avatar.melanie.png',
  'maximilian': '/avatar.maximillian.png',
  'julia': '/avatar.julia.png',
  'kirthan': '/avatar.kirthan.png',
};

/**
 * Get display name from a user object
 * Handles various Nextcloud user object formats
 */
export const getDisplayName = (user) => {
  return user.displayName || user.displayname || user.name || 
         user.fullName || user.username || user.uid || user.id || '';
};

/**
 * Get first name from a user object
 */
export const getFirstName = (user) => {
  const fullName = getDisplayName(user);
  return fullName.split(' ')[0];
};

/**
 * Get local avatar path for a user
 * Returns null if no avatar found
 */
export const getLocalAvatar = (user) => {
  const firstName = getFirstName(user).toLowerCase();
  
  // Try exact match
  if (USER_AVATAR_MAP[firstName]) {
    return USER_AVATAR_MAP[firstName];
  }
  
  // Try partial match
  for (const [key, avatar] of Object.entries(USER_AVATAR_MAP)) {
    if (firstName.includes(key) || key.includes(firstName)) {
      return avatar;
    }
  }
  
  return null;
};
