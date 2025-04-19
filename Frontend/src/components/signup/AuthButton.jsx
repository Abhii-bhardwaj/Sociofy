import { Loader2 } from "lucide-react";

const AuthButton = ({ label, isLoading }) => {
  return (
    <button
      type="submit"
      className="btn btn-primary w-full"
      disabled={isLoading}>
      {isLoading ? <Loader2 className="size-5 animate-spin" /> : label}
    </button>
  );
};

export default AuthButton;
