import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'locked';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-6 py-3 font-chaotic text-2xl tracking-wider uppercase transform transition-all duration-100 active:scale-95 border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]";
  
  const variants = {
    primary: "bg-green-600 hover:bg-green-500 text-white border-green-800",
    secondary: "bg-purple-600 hover:bg-purple-500 text-white border-purple-800",
    danger: "bg-red-600 hover:bg-red-500 text-white border-red-800",
    locked: "bg-gray-600 text-gray-400 border-gray-800 cursor-not-allowed shadow-none",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
