// SidePost.js
import React, { useState, useEffect } from "react";

const SidePost = ({ image, title, content }) => {
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }, []);

  return (
    <div className="w-full lg:w-3/4 xl:w-2/3 mx-auto p-2 rounded-lg mb-4 border-2 border-base-300 shadow-md shadow-base-300">
      {isLoading ? (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 shrink-0 rounded-full bg-base-300"></div>
            <div className="flex flex-col gap-2">
              <div className="skeleton h-4 w-24 bg-base-300"></div>
              <div className="skeleton h-3 w-32 bg-base-300"></div>
            </div>
          </div>
          <div className="skeleton h-48 w-full bg-base-300 rounded-lg"></div>
          <div className="skeleton h-4 w-3/4 bg-base-300"></div>
          <div className="skeleton h-4 w-2/3 bg-base-300"></div>
          <div className="flex gap-4 mt-2">
            <div className="skeleton h-6 w-16 bg-base-300"></div>
            <div className="skeleton h-6 w-20 bg-base-300"></div>
            <div className="skeleton h-6 w-20 bg-base-300"></div>
          </div>
        </div>
      ) : (
        <>
          {" "}
          <img
            alt="Side Post"
            className="w-full h-32 object-cover rounded-lg mb-4"
            src={image}
          />
          <h2 className="text-lg font-bold mb-2 text-base-content">{title}</h2>
          <p className="text-base-content/80">{content}</p>
        </>
      )}
    </div>
  );
};

export default SidePost;
