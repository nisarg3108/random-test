import React from 'react';

const FormField = ({ label, type = 'text', name, value, onChange, required = false, options = [], disabled = false }) => {
  const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "";
  const fieldClasses = `${baseClasses} ${disabledClasses}`;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <option value="">Select {label}</option>
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
    </div>
  );
};

export default FormField;