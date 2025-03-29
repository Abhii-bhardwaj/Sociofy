const Select = ({ options = [] }) => {
  if (!Array.isArray(options)) {
    return <p>No options available</p>; // Fallback UI
  }

  return (
    <select className="bg-base-200 text-base-content p-2 rounded-md w-full">
      {options.map((option, index) => (
        <option key={index}>{option}</option>
      ))}
    </select>
  );
};

export default Select;
