import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/Dropdown.module.css';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  value, 
  onChange, 
  options,
  placeholder = 'Select an option' 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the currently selected option label
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle option selection
  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div 
        className={`${styles.dropdownHeader} ${isOpen ? styles.active : ''}`} 
        onClick={toggleDropdown}
      >
        <span className={styles.selectedOption}>{displayText}</span>
        <span className={styles.dropdownArrow}>▼</span>
      </div>
      
      {isOpen && (
        <ul className={styles.dropdownList}>
          {options.map((option) => (
            <li 
              key={option.value} 
              className={`${styles.dropdownItem} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
