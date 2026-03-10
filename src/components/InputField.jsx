import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const InputField = ({ input, value, onChange }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = input.type === 'password';
  const isSelect = input.type === 'select';
  const isCheckbox = input.type === 'checkbox';
  const inputType = isPassword && !showPassword ? 'password' : 'text';

  if (isCheckbox) {
    const checked = value === 'true' || value === true;
    return (
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="w-4 h-4 rounded border-gray-600 bg-dark-surface text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
        />
        <span className="text-sm font-medium text-gray-300 group-hover:text-white">
          {input.label}
        </span>
      </label>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {input.label}
        {input.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {isSelect ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-dark-hover"
            required={input.required}
          >
            <option value="">{input.placeholder || 'Select an option'}</option>
            {input.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={input.placeholder || `Enter ${input.label.toLowerCase()}`}
            className="w-full"
            required={input.required}
          />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {input.description && (
        <p className="text-xs text-gray-500">{input.description}</p>
      )}
    </div>
  );
};

export default InputField;
