import { FaGoogle } from "react-icons/fa";

const GoogleAuth = () => {
  const handleGoogleSignIn = () => {
    window.open("http://localhost:5001/auth/google", "_self");
  };
  return (
    <div className="flex flex-col gap-4 mt-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="btn btn-outline w-full flex items-center gap-2">
        <FaGoogle className="size-5 text-error" />
        Continue with Google
      </button>
    </div>
  );
};

export default GoogleAuth;
