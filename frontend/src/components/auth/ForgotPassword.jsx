import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { passwordResetAPI } from '../../api/passwordReset.api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await passwordResetAPI.requestReset(email);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await passwordResetAPI.verifyOTP(email, otp);
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await passwordResetAPI.resetPassword(email, otp, newPassword);
      setStep(4);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="modern-card p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Verify OTP'}
              {step === 3 && 'New Password'}
              {step === 4 && 'Password Reset'}
            </h1>
            <p className="text-gray-600">
              {step === 1 && 'Enter your email to receive a reset code'}
              {step === 2 && 'Enter the 6-digit code sent to your email'}
              {step === 3 && 'Create a new secure password'}
              {step === 4 && 'Your password has been successfully reset'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-modern btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-modern text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Code sent to {email}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-modern btn-secondary flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary flex-1"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-modern"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-modern"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-modern btn-secondary flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary flex-1"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600">
                You can now sign in with your new password
              </p>
              <Link
                to="/"
                className="btn-modern btn-primary w-full inline-block text-center"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {/* Footer */}
          {step < 4 && (
            <div className="mt-8 text-center">
              <Link
                to="/"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;