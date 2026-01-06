import React from 'react'
import Image from 'next/image'

export default function HeroImage({path, alt, width, height, fill}: {path: string, alt: string, width?: number, height?: number, fill?: boolean}) {
  return (
    <Image className= 'rounded-full' src = {path} alt = {alt} width = {width} height = {height} fill= {fill}/>
  )
}
