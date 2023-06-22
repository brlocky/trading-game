import React, { ButtonHTMLAttributes, MouseEvent } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button = ({ onClick, children, className, ...restProps }: ButtonProps) => {
  const handleOnClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick && onClick(e);
  };

  const classes = `rounded bg-gray-300 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <button className={classes} onClick={handleOnClick} {...restProps}>
      {children}
    </button>
  );
};

export default Button;
