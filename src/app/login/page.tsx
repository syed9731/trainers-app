"use client";

import { useState, useCallback } from 'react';
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoginModel, LoginFormData } from '@/models/auth.models';
import { motion } from 'framer-motion';
import { authApis } from '@/lib/apis/auth.apis';
import { setUserDetailsToLocalStore } from '@/lib/utils/auth.utils';
import { useLoading } from '@/context/LoadingContext';
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useUser } from '@/context/UserContext';

export default function LoginPage() {
    const router = useRouter();
    const { setUser, resetUser } = useUser();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });

    const [show, setShow] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showLoader, hideLoader } = useLoading();
    const { handleNavigation } = useNavigation();

    // Forgot Password States
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [forgotPasswordData, setForgotPasswordData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    // Add state for 4-digit OTP
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

    // handles
    const handleLogin = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        showLoader()

        const loginModel = new LoginModel(formData);
        const validationError = loginModel.validate();

        if (validationError) {
            setError(validationError);
            hideLoader()
            return;
        }

        try {
            const data = await authApis.login(formData.email, formData.password);

            if (data.user_details && data.key_details) {
                setUserDetailsToLocalStore(data);
                resetUser();
                // Set user context
                setUser({
                    name: data.user_details.name,
                    email: data.user_details.email,
                    role: data.user_details.role_user === "Trainer" ? "Trainer" : "user_role",
                    profilePic: '',
                    isLoggedIn: true,
                    credits: 0
                });

                if (data.user_details.role_user === "Trainer") {
                    if (data.user_details.is_first_login) {
                        window.location.href = '/trainer-form';
                        return;
                    }
                    window.location.href = `/trainer-details?trainer=${data.user_details.name}`;
                } else {
                    window.location.href = '/';
                }
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
        } finally {
            hideLoader()
        }
    }, [formData, handleNavigation, hideLoader, router, setUser, showLoader]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: LoginFormData) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        showLoader();

        try {
            if (forgotPasswordStep === 'email') {
                await authApis.otp.generateOTP(forgotPasswordData.email);
                setForgotPasswordStep('otp');
                setError(null);
            } else if (forgotPasswordStep === 'otp') {
                const otp = otpDigits.join('');
                const response = await authApis.otp.verifyOTP(forgotPasswordData.email, otp);
                if (response.message.status === 'success') {
                    setError(null);
                    setForgotPasswordStep('reset');
                } else {
                    setError(response.message.message);
                }
            } else if (forgotPasswordStep === 'reset') {
                if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
                    setError('Passwords do not match');
                    return;
                }
                await authApis.Password.resetPassword(forgotPasswordData.email, forgotPasswordData.newPassword);
                setShowForgotPassword(false);
                setForgotPasswordStep('email');
                setForgotPasswordData({
                    email: '',
                    otp: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setOtpDigits(['', '', '', '']);
                setError(null);
            }
        } catch (err) {
            setError('Operation failed. Please try again.');
        } finally {
            hideLoader();
        }
    };

    const handleForgotPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForgotPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="flex flex-col  h-screen  transition-colors duration-300 bg-theme">

            <div className="flex flex-1 flex-col justify-center items-center relative">

                <motion.div

                    className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300"
                >
                    <p className="text-blue-600 text-xl font-extrabold hover:scale-105 self-center mb-3 text-center">Trainer&apos;s Mart</p>

                    {!showForgotPassword ? (
                        <>
                            <h2 className="text-3xl font-bold text-center text-gray-900  mb-6 transition-colors duration-300">Welcome Back</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form className="space-y-5" onSubmit={handleLogin}>
                                <div>
                                    <label className="block text-gray-700  font-semibold mb-1 transition-colors duration-300">Email</label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 bg-white  text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700  font-semibold mb-1 transition-colors duration-300">Password</label>
                                    <div className="flex relative">
                                        <input
                                            type={show ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 bg-whitetext-gray-900 "
                                        />
                                        {
                                            show ?
                                                <div className="absolute right-4 top-6">
                                                    <EyeOff
                                                        size={24}
                                                        className="transform -translate-y-1/2 cursor-pointer text-gray-500  transition-colors duration-300"
                                                        onClick={() => setShow(!show)}
                                                    />
                                                </div> :
                                                <div className="absolute right-4 top-6">
                                                    <Eye
                                                        size={24}
                                                        className="transform -translate-y-1/2 cursor-pointer text-gray-500  transition-colors duration-300"
                                                        onClick={() => setShow(!show)}
                                                    />
                                                </div>
                                        }
                                    </div>
                                </div>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: formData.email && formData.password ? 1.05 : 1 }}
                                    whileTap={{ scale: formData.email && formData.password ? 0.95 : 1 }}
                                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors duration-300 relative ${formData.email && formData.password
                                        ? 'bg-primary hover:bg-primary-hover text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    disabled={!formData.email || !formData.password}
                                >
                                    Login
                                </motion.button>
                            </form>

                            <p
                                className='forgot-password text-blue-600  cursor-pointer hover:underline text-center mt-4'
                                onClick={() => {
                                    setShowForgotPassword(true);
                                    setError(null);
                                }}
                            >
                                Forgot Password?
                            </p>

                            <p className="text-center text-gray-600  mt-4 transition-colors duration-300">
                                Don&apos;t have an account?&nbsp;
                                <a className="text-blue-600  font-semibold hover:underline ml-1 transition-colors duration-300 cursor-pointer"
                                    onClick={() => {
                                        window.location.href = '/signup';
                                        setError(null);
                                    }}
                                >Sign up</a>
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center mb-6 gap-3">
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotPasswordStep('email');
                                        setForgotPasswordData({
                                            email: '',
                                            otp: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                        setOtpDigits(['', '', '', '']);
                                        setError(null);
                                    }}
                                    className="text-gray-600  hover:text-gray-900  transition-colors duration-300"
                                >
                                    ⟵  &nbsp; back to login
                                </button>
                            </div>
                            <h2 className="text-3xl font-bold text-center text-gray-900  mb-6 transition-colors duration-300">
                                {forgotPasswordStep === 'email' ? 'Reset Password' :
                                    forgotPasswordStep === 'otp' ? 'Enter OTP' :
                                        'Set New Password'}
                            </h2>


                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleForgotPassword}>
                                {forgotPasswordStep === 'email' && (
                                    <div>
                                        <label className="block text-gray-700  font-semibold mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={forgotPasswordData.email}
                                            onChange={handleForgotPasswordInputChange}
                                            placeholder="Enter your email"
                                            className="w-full px-4 py-3 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                )}

                                {forgotPasswordStep === 'otp' && (
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-1">OTP</label>
                                        <div className="flex gap-2 justify-center">
                                            {otpDigits.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        if (!val) return;
                                                        const newOtp = [...otpDigits];
                                                        newOtp[idx] = val;
                                                        setOtpDigits(newOtp);
                                                        if (val && idx < 3) {
                                                            document.getElementById(`otp-input-${idx + 1}`)?.focus();
                                                        }
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                                                            document.getElementById(`otp-input-${idx - 1}`)?.focus();
                                                        }
                                                    }}
                                                    id={`otp-input-${idx}`}
                                                    className="w-12 h-12 text-center border border-gray-300 rounded-lg text-xl focus:ring-2 focus:ring-blue-500"
                                                    autoFocus={idx === 0}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {forgotPasswordStep === 'reset' && (
                                    <>
                                        <div>
                                            <label className="block text-gray-700  font-semibold mb-1">New Password</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={forgotPasswordData.newPassword}
                                                onChange={handleForgotPasswordInputChange}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-3 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700  font-semibold mb-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={forgotPasswordData.confirmPassword}
                                                onChange={handleForgotPasswordInputChange}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-3 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-4">
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-lg font-semibold"
                                    >
                                        {forgotPasswordStep === 'email' ? 'Send OTP' :
                                            forgotPasswordStep === 'otp' ? 'Verify OTP' :
                                                'Reset Password'}
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setForgotPasswordStep('email');
                                            setForgotPasswordData({
                                                email: '',
                                                otp: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            });
                                            setOtpDigits(['', '', '', '']);
                                        }}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </form>
                        </>
                    )}
                </motion.div>
                <a className="text-blue-600 font-semibold cursor-pointer mt-3 underline"
                    onClick={() => window.location.href = '/'}
                >Go Back</a>
            </div>

        </div>
    );
} 