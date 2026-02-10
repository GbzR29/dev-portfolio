import React from 'react'
import Image from 'next/image'

// Adicionamos 'className' às tipagens (opcional com o '?')
interface HeroImageProps {
  path: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string; // <-- Nova prop adicionada
}

export default function HeroImage({ path, alt, width, height, fill, className }: HeroImageProps) {
  return (
    <Image 
      // Combinamos a classe fixa 'rounded-full' com a que vier por fora
      className={`rounded-full ${className || ''}`} 
      src={path} 
      alt={alt} 
      width={width} 
      height={height} 
      fill={fill}
    />
  )
}