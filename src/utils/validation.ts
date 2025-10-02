export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+994(50|51|55|70|77|99|10|12)\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateFileType = (mimetype: string): boolean => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  return allowedTypes.includes(mimetype);
};

export const validateFileSize = (size: number, maxSizeMB: number = 5): boolean => {
  return size <= maxSizeMB * 1024 * 1024;
};