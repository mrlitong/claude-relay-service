import React from 'react';

interface ClaudeIconProps {
  className?: string;
  size?: number;
}

const ClaudeIcon: React.FC<ClaudeIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Claude AI official logo - simplified geometric design */}
      <path 
        d="M17.3277 3.91016L11.2305 7.1601L5.13184 3.91009L5.15039 12.5469L11.2305 15.78L17.3106 12.548L17.3277 3.91016Z" 
        fill="currentColor"
      />
      <path 
        d="M5.13184 12.5479V20.0898L11.2305 16.8398V9.28906L5.13184 12.5479Z" 
        fill="currentColor"
        opacity="0.7"
      />
      <path 
        d="M17.3281 12.5479V20.0898L11.2305 16.8398V9.28906L17.3281 12.5479Z" 
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
};

export default ClaudeIcon;