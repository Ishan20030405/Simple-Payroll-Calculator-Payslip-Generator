import React, { forwardRef, useId, useState } from 'react';
import { cleanPhone, phoneError, emailError, cleanEmergencyContact, emergencyContactError, cleanFullName, fullNameError } from '../utils/formValidation';

// Keeps native form validation and adds the same input behavior to button-driven forms.
const ValidatedInput = forwardRef(function ValidatedInput({onChange, onBlur, onKeyDown, onInvalid, name, type='text', min, max, step, maxLength, ...props}, ref) {
  const [error, setError] = useState('');
  const errorId = useId();
  const emergency = name === 'emergencyContact';
  const phone = emergency || ['phone','phone_number'].includes(name);
  const numeric = type === 'number' || (!props.readOnly && ['basic_pay','basic_salary','attendance_allowance','special_allowance','travelling_allowance','other_allowance','normal_ot_rate','sunday_ot_rate','late_rate','no_pay_rate','epf','other_deductions'].includes(name));
  const integer = ['working_days','year'].includes(name);
  const lengthLimits = {employeeId:10,fullName:100,email:150,nic:12,company_name:150,registration_number:100,tax_number:100,website:200,company_address:255,department_id:20,department_name:100};
  const actualType = phone ? 'tel' : name === 'email' ? 'email' : name === 'website' ? 'url' : numeric ? 'number' : type;
  const actualMax = max ?? (['epf_percentage','etf_percentage','tax_rate'].includes(name) ? 100 : name === 'working_days' ? 31 : name === 'working_hours' ? 24 : undefined);
  function check(input) {
    input.setCustomValidity('');
    const message = (name === 'fullName' ? fullNameError(input.value) : '') || (emergency ? emergencyContactError(input.value) : phone ? phoneError(input.value, 'Phone number', maxLength ?? (name === 'phone' ? 15 : 30)) : actualType === 'email' ? emailError(input.value) : '') || (props.required && !input.value.trim() ? 'This field is required.' : '');
    input.setCustomValidity(message);
    setError(input.validationMessage);
  }
  return <>
    <input {...props} ref={ref} name={name} type={actualType} min={min ?? (numeric ? 0 : undefined)} max={actualMax} step={step ?? (numeric ? integer ? 1 : 'any' : undefined)} maxLength={maxLength ?? (phone ? name === 'phone' ? 15 : 30 : lengthLimits[name])} inputMode={props.inputMode ?? (phone ? 'tel' : numeric ? integer ? 'numeric' : 'decimal' : undefined)} aria-invalid={error ? true : undefined} aria-describedby={[props['aria-describedby'], error ? errorId : ''].filter(Boolean).join(' ') || undefined}
      onChange={event => {
        if (name === 'fullName') event.target.value = cleanFullName(event.target.value);
        if (phone) event.target.value = emergency ? cleanEmergencyContact(event.target.value) : cleanPhone(event.target.value);
        if (name === 'nic') {
          const value = event.target.value.toUpperCase();
          if (!/^(?:\d{0,12}|\d{9}[VX])$/.test(value)) return;
          event.target.value = value;
        }
        if (numeric && event.target.value && !/^\d*(?:\.\d*)?$/.test(event.target.value)) return;
        event.target.setCustomValidity(''); setError(''); onChange?.(event);
      }}
      onKeyDown={event => { if (numeric && ['e','E','+','-'].includes(event.key) && !event.ctrlKey && !event.metaKey) event.preventDefault(); onKeyDown?.(event); }}
      onBlur={event => { if (!props.readOnly && !props.disabled) check(event.target); onBlur?.(event); }}
      onInvalid={event => { setError(event.target.validationMessage); onInvalid?.(event); }} />
    {error && !props.disabled && !props.readOnly && <small id={errorId} className="field-validation-error" role="alert">{error}</small>}
  </>;
});
export default ValidatedInput;
