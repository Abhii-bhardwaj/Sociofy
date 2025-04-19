import React, { useState } from "react";
import {
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";
import toast from "react-hot-toast";

const ShareModal = ({ postId, shareUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={24} className="text-green-500" />,
      action: () =>
        window.open(
          `https://api.whatsapp.com/send?text=Check out this post: ${shareUrl}`,
          "_blank"
        ),
    },
    {
      name: "Facebook",
      icon: <FaFacebook size={24} className="text-blue-600" />,
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`,
          "_blank"
        ),
    },
    {
      name: "Instagram",
      icon: <FaInstagram size={24} className="text-pink-500" />,
      action: () => {
        // Instagram doesn't have a direct share API, so we'll prompt to copy link
        toast("Copy the link and share it on Instagram!", { icon: "ℹ️" });
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
      },
    },
    {
      name: "Email",
      icon: <FaEnvelope size={24} className="text-gray-600" />,
      action: () =>
        (window.location.href = `mailto:?subject=Check out this post&body=${encodeURIComponent(
          shareUrl
        )}`),
    },
    {
      name: "Copy Link",
      icon: <FaLink size={24} className="text-blue-400" />,
      action: () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-80 shadow-lg">
        <h2 className="text-lg font-bold mb-4 text-base-content">Share Post</h2>
        <div className="grid grid-cols-2 gap-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => {
                option.action();
                if (option.name !== "Instagram" && option.name !== "Copy Link")
                  onClose();
              }}
              className="flex flex-col items-center p-2 hover:bg-base-200 rounded transition-all duration-200">
              {option.icon}
              <span className="mt-2 text-sm text-base-content/80">
                {option.name}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 btn btn-outline btn-sm w-full">
          Close
        </button>
        {copied && (
          <p className="text-sm text-success mt-2 text-center">Copied!</p>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
