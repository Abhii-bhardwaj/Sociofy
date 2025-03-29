import React from "react";
const Section = ({ title, children }) => {
  return (
    <div className="mb-4">
      <div className="text-sm font-bold mb-2 text-base-content">{title}</div>
      {children}
    </div>
  );
};

export default Section;
