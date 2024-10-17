// Tooltip.js
import React, { useState } from 'react';
import './tooltip.css';

const Tooltip = ({ message }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className="tooltip-container">
      <span
        className="tooltip-icon"
        onMouseOver={() => setShowTooltip(true)}
        onMouseOut={() => setShowTooltip(false)}
      >
        ⓘ
      </span>
      {showTooltip && <div className="tooltip-message">{message}</div>}
    </span>
  );
};

export default Tooltip;

