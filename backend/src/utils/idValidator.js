// utils/idValidator.js
// ตรวจสอบเลขบัตรประชาชน 13 หลัก (checksum ของประเทศไทย)

export const isValidThaiID = (id) => {
  if (!/^[0-9]{13}$/.test(id)) return false;
  const digits = id.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (13 - i), 0);
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === digits[12];
};
