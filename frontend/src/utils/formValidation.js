export const text = value => String(value ?? '').trim();
export const cleanFullName = value => String(value).replace(/\p{N}/gu, '');
export const fullNameError = value => /\p{N}/u.test(String(value ?? '')) ? 'Full name cannot contain numbers.' : '';
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
export const isMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value)) && Number(String(value).slice(0, 4)) >= 1900;
export const isTime = value => /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(value));
export function numberError(value, label, { required = true, min = 0, max = 99999999.99, integer = false } = {}) {
  if (text(value) === '') return required ? `${label} is required.` : '';
  if (!/^\d+(?:\.\d+)?$/.test(String(value)) || !Number.isFinite(Number(value))) return `${label} must be a valid non-negative number.`;
  if (integer && !Number.isInteger(Number(value))) return `${label} must be a whole number.`;
  if (Number(value) < min || Number(value) > max) return `${label} must be between ${min} and ${max}.`;
  return '';
}
export function phoneError(value, label = 'Phone number', maxLength = 30) {
  if (!text(value)) return '';
  if (!/^\+?[\d ()-]+$/.test(value) || !/^\d{7,15}$/.test(value.replace(/\D/g, '')) || value.length > maxLength) return `${label} must contain 7 to 15 digits, with an optional leading +, spaces, parentheses or hyphens (maximum ${maxLength} characters).`;
  return '';
}
export const cleanPhone = value => String(value).replace(/[^\d+ ()-]/g, '').replace(/(?!^)\+/g, '');
export const cleanEmergencyContact = value => String(value).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
export const emergencyContactError = value => value && !/^\+?\d{7,15}$/.test(String(value)) ? 'Emergency contact must contain 7 to 15 digits with an optional leading +. Spaces and other characters are not allowed.' : '';
export const emailError = value => text(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value)) ? 'Enter a valid email address, such as name@example.com.' : '';
export function lengthError(value, label, max, required = false) {
  if (required && !text(value)) return `${label} is required.`;
  return String(value ?? '').length > max ? `${label} must be ${max} characters or fewer.` : '';
}
export function employeeError(data, editing = false) {
  let error = lengthError(data.fullName, 'Full name', 100, true) || fullNameError(data.fullName) || lengthError(data.email, 'Email', 100, true) || emailError(data.email) || phoneError(data.phone, 'Phone number', 15);
  if (error) return error;
  if (text(data.employeeId) && !/^[A-Za-z0-9_-]{1,10}$/.test(text(data.employeeId))) return 'Employee ID must use 1 to 10 letters, digits, hyphens or underscores.';
  if (!/^(?:\d{9}[VXvx]|\d{12})$/.test(text(data.nic))) return 'NIC must contain 9 digits followed by V or X, or exactly 12 digits.';
  if (!data.department) return 'Select a department.';
  for (const [key, label] of [['dob', 'Date of birth'], ['joinDate', 'Joining date']]) if (data[key] && !isDate(data[key])) return `${label} must be a valid calendar date.`;
  if (data.dob && data.dob >= today()) return 'Date of birth must be before today.';
  if (data.dob && data.joinDate && data.joinDate <= data.dob) return 'Joining date must be after the date of birth.';
  if (!editing && String(data.initialPassword ?? '').length < 8) return 'Initial password must contain at least 8 characters.';
  if (!editing && new TextEncoder().encode(data.initialPassword).length > 72) return 'Initial password must be no more than 72 bytes.';
  return emergencyContactError(data.emergencyContact) || lengthError(data.address, 'Address', 2000);
}
export function companyError(data) {
  const error = lengthError(data.company_name, 'Company name', 150, true) || lengthError(data.email, 'Company email', 150) || emailError(data.email) || phoneError(data.phone_number) || lengthError(data.website, 'Website', 200) || lengthError(data.registration_number, 'Registration number', 100) || lengthError(data.tax_number, 'Tax number', 100) || lengthError(data.company_address, 'Company address', 255);
  if (error) return error;
  if (text(data.website)) {
    try { const url = new URL(data.website); if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw Error(); }
    catch { return 'Enter a complete website address, such as https://example.com.'; }
  }
  return '';
}
export function payrollSettingsError(data) {
  for (const [key, label, options] of [
    ['working_days', 'Working days', {min:1,max:31,integer:true}], ['working_hours', 'Working hours', {min:1,max:24}],
    ['ot_rate', 'Overtime multiplier', {max:99999999.99}], ['sunday_ot_rate', 'Sunday overtime multiplier', {max:99999999.99}],
    ['epf_percentage', 'EPF percentage', {max:100}], ['etf_percentage', 'ETF percentage', {max:100}]
  ]) { const error = numberError(data[key], label, options); if (error) return error; }
  if (!isTime(data.check_in_time) || !isTime(data.check_out_time)) return 'Enter valid check-in and check-out times.';
  return '';
}
export function departmentError(data) {
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(text(data.department_id))) return 'Department ID must use 1 to 20 letters, digits, hyphens or underscores.';
  return lengthError(data.department_name, 'Department name', 100, true);
}
export function designationError(data) {
  return lengthError(data.designation_name, 'Designation title', 50, true) || (!data.department ? 'Select a department.' : '') || numberError(data.basic_salary, 'Basic salary', {required:false});
}
export function salaryStructureError(data) {
  if (!data.department || !data.designation) return 'Select a department and designation.';
  for (const [key, value] of Object.entries(data)) {
    if (['department','designation'].includes(key)) continue;
    const error = numberError(value, key.replaceAll('_', ' '), {required:key === 'basic_pay'});
    if (error) return error;
  }
  return '';
}
export function attendanceError(data, requireEmployee = true) {
  if (requireEmployee && !data.employee_id) return 'Select an employee.';
  if (!isDate(data.date)) return 'Select a valid attendance date.';
  if (!['Present','Late','Absent','Leave','Holiday'].includes(data.status)) return 'Select a valid attendance status.';
  if (['Absent','Leave','Holiday'].includes(data.status)) return '';
  if (!isTime(data.check_in) || !isTime(data.check_out)) return 'Enter both check-in and check-out times.';
  if (data.check_in === data.check_out) return 'Check-in and check-out times must be different.';
  // Earlier check-out times are valid overnight shifts.
  return '';
}
export function reportFilterError(filters) {
  if (filters.type === 'daily-attendance') return isDate(filters.date) ? '' : 'Select a valid attendance date.';
  return numberError(filters.year, 'Report year', {min:1900,max:9999,integer:true}) || numberError(filters.month, 'Report month', {min:1,max:12,integer:true});
}
export function taxBracketsError(brackets) {
  if (!brackets.length) return 'Add at least one tax bracket.';
  let previousMax = 0;
  for (const [index, bracket] of brackets.entries()) {
    const label = `Tax bracket ${index + 1}`;
    const error = numberError(bracket.tax_rate, `${label} rate`, {max:100});
    if (error) return error;
    const range = text(bracket.monthly_salary_range).replaceAll(',', '').toLowerCase();
    let min, max, match;
    if ((match = range.match(/^up to\s+(\d+(?:\.\d+)?)$/))) { min=0; max=Number(match[1]); }
    else if ((match = range.match(/^(?:over|above)\s+(\d+(?:\.\d+)?)$/))) { min=Number(match[1]); max=Infinity; }
    else if ((match = range.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/))) { min=Number(match[1]); max=Number(match[2]); }
    else if ((match = range.match(/^(\d+(?:\.\d+)?)$/))) { min=Number(match[1]); max=Infinity; }
    else return `${label}: use a range such as Up to 100,000, 100,001 - 150,000 or Over 150,000.`;
    if (max <= min || min < previousMax || min - previousMax > 1) return `${label}: ranges must be ascending, non-overlapping and have no gaps larger than 1.`;
    previousMax=max;
  }
  return '';
}
