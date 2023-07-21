import React, { useState } from 'react';

export interface IDropdownOption {
  label: string;
  value: string;
}

interface IDropdownProps {
  options: IDropdownOption[];
  selectedOption?: IDropdownOption | null;
  onChange?: (option: IDropdownOption) => void;
  label?: string;
}

const Dropdown: React.FC<IDropdownProps> = ({ options, selectedOption, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option: IDropdownOption) => {
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div className="relative z-50">
      <button
        className="bg-gray-300 py-2 px-4 rounded-md text-gray-800 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? <span className="truncate">{selectedOption.label}</span> : label ? label : 'Select an option'}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white rounded-md shadow-lg cursor-pointer">
          <ul>
            {options.map((option) => (
              <li key={option.value} className="px-4 py-2 hover:bg-gray-100" onClick={() => handleOptionClick(option)}>
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
