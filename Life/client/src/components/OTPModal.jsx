import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import api from "../services/api";
import { toast } from "react-toastify";

export default function OTPModal({ isOpen, onClose, donorId, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/verify-donor-otp/${donorId}`, { otp });

      toast.success(res.data.message || "Verification successful!");
      onSuccess(); // Clear form & close modal
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 shadow-lg w-full max-w-sm"
      >
        <h2 className="text-xl font-bold text-center mb-4">Verify Your OTP</h2>

        <p className="text-gray-600 text-center mb-4">
          Enter the 6-digit OTP sent to your email.
        </p>

        <input
          type="text"
          maxLength="6"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-green focus:ring-primary-green p-2 text-center text-lg tracking-widest"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="flex-1 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
