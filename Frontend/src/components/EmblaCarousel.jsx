import useEmblaCarousel from "embla-carousel-react";

const EmblaCarousel = ({ images }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  return (
    <div className="overflow-hidden w-full h-64" ref={emblaRef}>
      <div className="flex">
        {images.map((img, index) => (
          <div key={index} className="min-w-full">
            <img
              src={img.url}
              alt={`Slide ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmblaCarousel;
