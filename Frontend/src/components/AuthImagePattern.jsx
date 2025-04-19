import { useState, useEffect, useRef } from "react";

const AuthImagePattern = ({ title, subtitle, changeInterval = 2000 }) => {
  // Define a constant array of local image paths
  // Replace these paths with your actual local image paths
  const LOCAL_IMAGES = [
    "/avatars/1.png",
    "/avatars/2.png",
    "/avatars/3.png",
    "/avatars/4.png",
    "/avatars/5.png",
    "/avatars/6.png",
    "/avatars/7.png",
    "/avatars/8.png",
    "/avatars/9.png",
    "/avatars/10.png",
    "/avatars/11.png",
    "/avatars/12.png",
    "/avatars/13.png",
    "/avatars/14.png",
    "/avatars/15.png",
    "/avatars/16.png",
    "/avatars/17.png",
    "/avatars/18.png",
    "/avatars/19.png",
    "/avatars/20.png",
    "/avatars/21.png",
    "/avatars/22.png",
    "/avatars/23.png",
    "/avatars/24.png",
    "/avatars/25.png",
    "/avatars/26.png",
    "/avatars/27.png",
    "/avatars/28.png",
    "/avatars/29.png",
    "/avatars/30.png",
    "/avatars/31.png",
    "/avatars/32.png",
    "/avatars/33.png",
    "/avatars/34.png",
    "/avatars/35.png",
    "/avatars/36.png",
    "/avatars/37.png",
    "/avatars/38.png",
    "/avatars/39.png",
    "/avatars/40.png",
  ];

  // State to hold current avatar URLs
  const [currentAvatars, setCurrentAvatars] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);
  const previousAvatarsRef = useRef([]);

  // Function to get 9 random images from our local collection
  // ensuring no duplicates with previous set
  const getRandomAvatars = () => {
    // Create a copy of all available images
    const availableImages = [...LOCAL_IMAGES];
    // Filter out previously used images
    const filteredImages = availableImages.filter(
      (img) => !previousAvatarsRef.current.includes(img)
    );

    // If we don't have enough unique images, just use what we have
    if (filteredImages.length < 9) {
      console.warn("Not enough unique images available, some may repeat");
      return shuffleArray([...LOCAL_IMAGES]).slice(0, 9);
    }

    // Otherwise, return 9 random unique images from the filtered list
    return shuffleArray(filteredImages).slice(0, 9);
  };

  // Helper function to shuffle an array
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Update avatars with enhanced animation effects
  const updateAvatars = () => {
    // Store current avatars before updating
    previousAvatarsRef.current = [...currentAvatars];
    // Get new avatars
    setCurrentAvatars(getRandomAvatars());
  };

  // Initialize on first render
  useEffect(() => {
    // Initial set of avatars
    setCurrentAvatars(shuffleArray([...LOCAL_IMAGES]).slice(0, 9));
  }, []);

  // Update avatars every changeInterval ms with improved control
  useEffect(() => {
    if (currentAvatars.length > 0) {
      // Set up the interval if not hovering
      if (!isHovering) {
        intervalRef.current = setInterval(updateAvatars, changeInterval);
      }

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [changeInterval, isHovering, currentAvatars]);

  // Preload images to avoid flicker
  useEffect(() => {
    LOCAL_IMAGES.forEach((path) => {
      const img = new Image();
      img.src = path;
    });
  }, []);

  // Handle mouse interactions
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    intervalRef.current = setInterval(updateAvatars, changeInterval);
  };


  // Return default UI while images load
  if (currentAvatars.length === 0) {
    return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
        Loading...
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center justify-center r bg-base-200 p-12 rounded-lg shadow-lg">
      <div className="max-w-md text-center p-6 bg-base-100 rounded-lg shadow-md">
        <div
          className="grid grid-cols-3 gap-3 mb-8"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
          {currentAvatars.map((path, i) => (
            <div
              key={i}
              className="aspect-square rounded-full overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="relative w-full h-full group">
                <img
                  src={path}
                  alt={`Avatar ${i + 1}`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  style={{ transitionDelay: `${i * 100}ms` }}
                  onError={(e) => {
                    // Fallback to first avatar if there's an error
                    e.target.src = LOCAL_IMAGES[0];
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60 mb-6">{subtitle}</p>

      </div>
    </div>
  );
};

export default AuthImagePattern;
