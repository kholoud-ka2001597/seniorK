import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoPlay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';


const slides = [
  {
    url: "/images/slider/1.jpeg",
    title: "Luxurious Getaways ",
    subtitle: "Discover Qatar's finest resorts"
  },
  {
    url: "/images/slider/2.jpeg",
    title: "Majestic Doha Skyline",
    subtitle: "Marvel at Qatar's modern wonder"
  },
  {
    url: "/images/slider/3.jpeg",
    title: "Explore Qatar",
    subtitle: "Discover, Book and Enjoy"
  },
  {
    url: "/images/slider/4.jpeg",
    title: "Enchanting Souq Waqif",
    subtitle: "Step into Qatar's timeless Charm"
  },
  {
    url: "/images/slider/5.jpeg",
    title: "Explore Desert Adventures",
    subtitle: "Embrace the spirit of the Sands"
  },
  {
    url: "/images/slider/6.jpeg",
    title: "Vibrant Cities",
    subtitle: "Experience the heartbeat of urban life"
  },  
  {
    url: "/images/slider/7.jpeg",
    title: "Adventure in Qatar",
    subtitle: "Experience Thrills Like No Other"
  }
];


export default function ImageSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    AutoPlay({ delay: 5000, stopOnInteraction: false })
  ]);
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] w-full bg-cover bg-center transition-transform duration-500">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0"
            >
              <div 
                className="relative h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] w-full bg-cover bg-center transition-transform duration-500"
                style={{ backgroundImage: `url(${slide.url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2 sm:space-y-4 max-w-4xl px-4">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                      {slide.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-white"
        onClick={scrollPrev}
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-white"
        onClick={scrollNext}
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 transition-all duration-300 ${
              index === selectedIndex 
                ? 'w-6 sm:w-8 bg-white' 
                : 'w-3 sm:w-4 bg-white/50'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
}