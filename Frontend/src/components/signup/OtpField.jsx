const OtpField = ({ value, onChange, countdown, canResend, onResend }) => {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">OTP</span>
      </label>
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Enter the OTP sent to your email"
        value={value}
        onChange={onChange}
      />
      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm ext-base-content/60">
          {countdown > 0
            ? `Resend OTP in ${countdown}s`
            : "Didn't receive OTP?"}
        </span>
        {canResend && (
          <button
            type="button"
            className="text-primary text-sm font-medium"
            onClick={onResend}>
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
};

export default OtpField;
