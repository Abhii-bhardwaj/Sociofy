import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Lock,
  Mail,
  MessageSquare,
  User,
  CircleUserRound,
  Calendar,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";
import InputField from "../components/signup/Input";
import OtpField from "../components/signup/OtpField";
import AuthButton from "../components/signup/AuthButton";
import GoogleAuth from "../components/signup/GoogleAuth";
import APP_LOGO from "../assets/Sociofy_logo_.webp";

const SignUpPage = () => {
  const { authUser, checkAuth, checkUsername, generateUsernameSuggestion } =
    useAuthStore();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    dob: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("");
  const { isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  useEffect(() => {
    checkAuth();
    if (authUser) {
      navigate(authUser.role === "admin" ? "/admin/dashboard" : "/");
    }
  }, [authUser, navigate]);

  const checkUsernameAvailability = async (username) => {
    const result = await checkUsername(username);
    if (!username || username.trim() === "") {
      setUsernameStatus("");
    } else if (result.available) {
      setUsernameStatus("Username is available");
    } else {
      const suggestion = await generateUsernameSuggestion(formData.fullName);
      setUsernameStatus(`Username taken. Try: ${suggestion}`);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.dob
    ) {
      return toast.error("All fields are required!");
    }

    try {
      await useAuthStore.getState().sendOtp(formData.email);
      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      toast.error("Failed to send OTP. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp) return toast.error("OTP is required");

    try {
      await useAuthStore.getState().verifyOtp(formData.email, formData.otp);
      const response = await useAuthStore.getState().signup({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        dob: formData.dob,
        otp: formData.otp,
      });
      if (formData.username && formData.username !== response.username) {
        setUsernameStatus(`Username changed to: ${response.username}`);
      }
      navigate(response.user.role === "admin" ? "/admin/dashboard" : "/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-full h-full rounded-xl flex items-center justify-center transition-colors">
                <img
                                  src={APP_LOGO}
                                  alt="Sociofy Logo"
                                  className="w-48 h-20"
                                />
              </div>
              <h1 className="text-2xl font-bold -mt-5 text-base-content">
                Create Account
              </h1>
              <p className="text-base-content/60">
                Get started with your free account
              </p>
            </div>
          </div>

          <form
            onSubmit={otpSent ? handleSubmit : handleSendOtp}
            className="space-y-6">
            <InputField
              label="Full Name"
              type="text"
              required={true}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              icon={User}
            />
            <div className="relative">
              <InputField
                label="Username"
                type="text"
                required={false}
                placeholder="Enter your username (optional)"
                value={formData.username}
                onChange={(e) => {
                  const newUsername = e.target.value;
                  setFormData({ ...formData, username: newUsername });
                  checkUsernameAvailability(newUsername);
                }}
                icon={CircleUserRound}
              />
              {usernameStatus && (
                <p
                  className={`text-sm mt-1 ${
                    usernameStatus.includes("available")
                      ? "text-success"
                      : usernameStatus.includes("taken") ||
                        usernameStatus.includes("changed")
                      ? "text-error"
                      : "text-warning"
                  }`}>
                  {usernameStatus}
                </p>
              )}
            </div>
            <InputField
              label="Email"
              type="email"
              required={true}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              icon={Mail}
            />
            <InputField
              label="Password"
              type="password"
              required={true}
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              icon={Lock}
              showPasswordToggle={true}
            />
            <InputField
              label="Date of Birth"
              type="date"
              required={true}
              placeholder="Select your date of birth"
              value={formData.dob}
              onChange={(e) =>
                setFormData({ ...formData, dob: e.target.value })
              }
              icon={Calendar}
            />
            {otpSent && (
              <OtpField
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                countdown={countdown}
                canResend={canResend}
                onResend={handleSendOtp}
              />
            )}
            <AuthButton
              label={otpSent ? "Signup" : "Send OTP"}
              isLoading={isSigningUp}
            />
            <GoogleAuth />
          </form>

          <p className="text-center text-base-content">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <AuthImagePattern
        title={"Welcome to the world of new Social revolution!"}
        subtitle={
          "Create your account. Inspire, connect, and stand out with Sociofy!"
        }
      />
    </div>
  );
};

export default SignUpPage;
