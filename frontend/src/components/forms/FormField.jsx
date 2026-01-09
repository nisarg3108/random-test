import React from 'react';

const FormField = ({ label, type = 'text', name, value, onChange, required = false, options = [], disabled = false, error = null }) => {
  const baseClasses = "input-modern";
  const errorClasses = error ? "border-red-300 bg-red-50" : "";
  const disabledClasses = disabled ? "bg-primary-100 cursor-not-allowed opacity-60" : "";
  const fieldClasses = `${baseClasses} ${errorClasses} ${disabledClasses}`;

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-primary-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={fieldClasses}
          required={required}
          disabled={disabled}
        >
          <option value="" className="text-primary-500">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className={fieldClasses}
          required={required}
          disabled={disabled}
          rows={3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={fieldClasses}
          required={required}
          disabled={disabled}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;