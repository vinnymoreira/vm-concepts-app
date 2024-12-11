import React from 'react';

const ToggleSwitch = ({ isOn, handleToggle, onColor }) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={isOn}
          onChange={handleToggle}
        />
        <div className={`block w-14 h-8 rounded-full ${isOn ? onColor : 'bg-gray-600'} transition`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isOn ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;