"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, FileText, Mail, AlertCircle } from "lucide-react";

interface LegalModalProps {
  type: "privacy" | "terms" | "dmca" | "contact" | null;
  onClose: () => void;
}

export default function LegalModals({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#07090e] border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            {type === "privacy" && <ShieldCheck className="w-5 h-5 text-indigo-400" />}
            {type === "terms" && <FileText className="w-5 h-5 text-cyan-400" />}
            {type === "dmca" && <AlertCircle className="w-5 h-5 text-amber-400" />}
            {type === "contact" && <Mail className="w-5 h-5 text-emerald-400" />}

            <h3 className="text-base font-bold text-white">
              {type === "privacy" && "Privacy Policy"}
              {type === "terms" && "Terms of Service"}
              {type === "dmca" && "DMCA Copyright Disclaimer"}
              {type === "contact" && "Contact & Support"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition bg-slate-900 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-2 text-xs text-slate-300 space-y-4 leading-relaxed font-sans">
          {type === "privacy" && (
            <>
              <p>
                <strong>Last Updated: 2026</strong>
              </p>
              <p>
                We respect your privacy. This Privacy Policy describes how we handle user data when using our YouTube Video and Playlist Downloader.
              </p>
              <h4 className="font-bold text-white text-sm">1. No Personal Data Collection</h4>
              <p>
                We do not collect, store, or sell any personal information. We do not require accounts, logins, or credit card details.
              </p>
              <h4 className="font-bold text-white text-sm">2. Server Logs & Processing</h4>
              <p>
                Media URLs submitted by users are processed in-memory solely for video analysis and streaming. No downloaded videos or audio files are permanently retained on our servers.
              </p>
              <h4 className="font-bold text-white text-sm">3. Third-Party Advertising & Cookies</h4>
              <p>
                We may use third-party advertising partners (such as Monetag, Google AdSense, or Adsterra) to serve ads when you visit our website. These companies may use cookies to provide personalized advertisements according to their respective privacy policies.
              </p>
            </>
          )}

          {type === "terms" && (
            <>
              <p>
                <strong>Effective Date: 2026</strong>
              </p>
              <p>
                By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
              <h4 className="font-bold text-white text-sm">1. Permitted Use</h4>
              <p>
                This tool is intended strictly for personal, non-commercial, and educational fair-use downloading of publicly accessible content, Creative Commons media, or content for which you own the rights.
              </p>
              <h4 className="font-bold text-white text-sm">2. Disclaimer of Liability</h4>
              <p>
                Users are solely responsible for ensuring that their use of downloaded materials complies with all applicable copyright laws and platform terms of service.
              </p>
            </>
          )}

          {type === "dmca" && (
            <>
              <p>
                We respect the intellectual property rights of others and comply with the Digital Millennium Copyright Act (DMCA).
              </p>
              <h4 className="font-bold text-white text-sm">Copyright Policy</h4>
              <p>
                We do not host or store any copyright-infringing media files on our servers. All video and audio streams are processed dynamically in-memory from publicly available YouTube servers.
              </p>
              <p>
                If you are a copyright owner and wish to request content filtering or report an infringement, please email us with the relevant URL and proof of ownership.
              </p>
            </>
          )}

          {type === "contact" && (
            <>
              <p>Have questions, feedback, or business inquiries? Get in touch with our team.</p>
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <p className="text-white font-bold">Email Support:</p>
                <p className="font-mono text-cyan-400">contact.support@ytdownloader.com</p>
                <p className="text-slate-400 text-[11px]">
                  Response time: Usually within 24–48 business hours.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 mt-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
