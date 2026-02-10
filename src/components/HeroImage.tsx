import React from 'react'
import Image from 'next/image'

interface HeroImageProps {
  path: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string; 
}

export default function HeroImage({ path, alt, width, height, fill, className }: HeroImageProps) {
  return (
    <Image 
  
      className={`rounded-full ${className || ''}`} 
      src={path} 
      alt={alt} 
      width={width} 
      height={height} 
      fill={fill}
    />
  )
}