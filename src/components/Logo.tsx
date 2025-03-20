import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LogoProps {
  className?: string;
  color?: 'default' | 'white';
  onClick?: () => void;
}

export default function Logo({ className = "h-8", color = 'default', onClick }: LogoProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className={`flex items-center ${className} cursor-pointer`}
      onClick={handleClick}
    >
      <img 
        src="https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG"
        alt="Kiloukoi"
        className={`${className} ${color === 'white' ? 'brightness-0 invert' : ''}`}
      />
    </div>
  );
}