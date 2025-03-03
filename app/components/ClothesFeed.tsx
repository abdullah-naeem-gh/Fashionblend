import ClothingPost from './ClothingPost'

const SAMPLE_CLOTHES = [
  {
    id: 1,
    imageUrl: '/images/embroidered-lawn.jpg',
    title: 'Embroidered Lawn Suit',
    price: 5999,
    brand: 'Khaadi'
  },
  // Add more items as needed
]

const ClothesFeed = () => {
  return (
    <div className="snap-y snap-mandatory h-screen w-full overflow-y-scroll">
      {SAMPLE_CLOTHES.map((item) => (
        <div key={item.id} className="snap-start h-screen w-full">
          <ClothingPost
            imageUrl={item.imageUrl}
            title={item.title}
            price={item.price}
            brand={item.brand}
          />
        </div>
      ))}
    </div>
  )
}

export default ClothesFeed 