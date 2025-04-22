import React, { useState, useEffect } from "react";
import { UserPlus, Gift, ArrowRight } from "lucide-react";
import { createUser, applyReferralCode } from "../firebase/users";

interface SignupComponentProps {
  onComplete: () => void;
}

export function SignupComponent({ onComplete }: SignupComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;

  useEffect(() => {
    // Extract referral code from Telegram WebApp initData
    const initData = new URLSearchParams(window.Telegram.WebApp.initData);
    let refCode = initData.get("start_param") || "";

    // Fallback to URL parameter (for browser testing)
    if (!refCode) {
      const urlParams = new URLSearchParams(window.location.search);
      refCode = urlParams.get("ref") || "";
    }

    // Remove "ref_" prefix if present
    if (refCode.startsWith("ref_")) {
      refCode = refCode.replace("ref_", "");
    }

    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  const handleSignup = async () => {
    if (!user?.id) {
      setError("Could not get Telegram user data");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create user in database
      const result = await createUser(user.id.toString(), {
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        photoUrl: user.photo_url,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // If there's a referral code, apply it
      if (referralCode) {
        await applyReferralCode(user.id.toString(), referralCode);
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-500/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
              Welcome to Tonbox!
            </h2>
            <p className="text-gray-400 mt-2">
              {user?.first_name || user?.username || "User"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Your Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Username</span>
                  <span className="text-purple-400">@{user?.username || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span className="text-purple-400">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
              </div>
            </div>

            {referralCode && (
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold">Referral Bonus</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  You were invited with code:
                </p>
                <div className="bg-purple-500/20 rounded-xl px-4 py-2 font-mono text-purple-400">
                  {referralCode}
                </div>
              </div>
            )}

            <button
              onClick={handleSignup}
              disabled={loading || success}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                success
                  ? "bg-green-500 cursor-not-allowed"
                  : loading
                  ? "bg-purple-500/50 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {success ? (
                "Welcome to Tonbox!"
              ) : loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing Up...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              By continuing, you agree to our Terms and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
        }