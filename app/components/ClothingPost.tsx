import Image from 'next/image'
import { MenuIcon } from '@heroicons/react/outline'

interface ClothingPostProps {
  imageUrl: string
  title: string
  price: number
  brand: string
}

const ClothingPost = ({ imageUrl, title, price, brand }: ClothingPostProps) => {
  return (
    <div className="relative w-full h-screen">
      {/* Main Image */}
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="w-full h-full"
        />
        
        {/* Menu Button */}
        <button className="absolute top-4 right-4 p-2 bg-white rounded-full">
          <MenuIcon className="h-6 w-6 text-gray-800" />
        </button>

        {/* Product Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent text-white">
          <h2 className="text-4xl font-bold mb-2">{title}</h2>
          <p className="text-3xl mb-2">Rs. {price}</p>
          <p className="text-xl">{brand}</p>
        </div>
      </div>
    </div>
  )
}

export default ClothingPost 