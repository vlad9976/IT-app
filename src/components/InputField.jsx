import React from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

const InputField = ({ input, value, onChange }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = input.type === 'password';
  const isSelect = input.type === 'select';
  const isCheckbox = input.type === 'checkbox';
  const isTextarea = input.type === 'textarea';
  const inputType = isPassword && !showPassword ? 'password' : 'text';

  if (isCheckbox) {
    const checked = value === 'true' || value === true;
    return (
      <div className="space-y-0.5">
        <label className={`flex items-center gap-3 cursor-pointer group rounded-lg px-3 py-2.5 transition-all duration-150 border ${
          checked
            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
            : 'bg-dark-surface/50 border-dark-border hover:border-gray-500 hover:bg-dark-surface/70'
        }`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all ${
            checked ? 'bg-emerald-500 border-2 border-emerald-500' : 'border-2 border-gray-500'
          }`}>
            {checked && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
          </span>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className="sr-only"
          />
          <span className={`text-sm font-medium ${checked ? 'text-emerald-200' : 'text-gray-400 group-hover:text-gray-300'}`}>
            {input.label}
          </span>
        </label>
        {input.description && (
          <p className="text-xs text-gray-500 pl-8 mt-0.5">{input.description}</p>
        )}
      </div>
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
        ) : isTextarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={input.placeholder || `Enter ${input.label.toLowerCase()}`}
            className="w-full min-h-[100px] resize-y"
            required={input.required}
            rows={4}
          />
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
