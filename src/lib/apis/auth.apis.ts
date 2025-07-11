import axios from 'axios';
import { getAuthHeaders } from '../utils/auth.utils';
import { User } from "@/models/auth.models";

export const authApis = {
    // Login
    login: async (email: string, password: string) => {
        try {
            const response = await axios.post('/api/method/trainer.api.customLogin', {
                usr: email,
                pwd: password
            });
            return response.data;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            const response = await axios.post('/api/method/logout', {}, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    },
    singUp: async (user: User) => {
        try {
            const response = await axios.post('/api/method/trainer.api.signup_User', user);
            return response.data.data;
        } catch (error) {
            console.error('Error during signup:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUserRole: async () => {
        try {
            const response = await axios.get('/api/method/frappe.auth.get_logged_user', {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    },

    // Get user permissions
    getUserPermissions: async () => {
        try {
            const response = await axios.get('/api/method/frappe.permissions.get_user_permissions', {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user permissions:', error);
            throw error;
        }
    },

    otp: {
        generateOTP: async (email: string) => {
            try {
                const response = await axios.post('/api/method/trainer.api.generate_otp', {
                    email: email
                });
                return response.data;
            } catch (error) {
                console.error('Error generating OTP:', error);
                throw error;
            }
        },

        // Verify OTP
        verifyOTP: async (email: string, enteredOTP: string) => {
            try {
                const response = await axios.post('/api/method/trainer.api.verify_otp', {
                    email: email,
                    entered_otp: enteredOTP
                });
                return response.data;
            } catch (error) {
                console.error('Error verifying OTP:', error);
                throw error;
            }
        },


    },


    captcha: {
        verifyCaptcha: async (token: string) => {
            try {
                const response = await axios.post('/api/method/trainer.api.verify_captcha', {
                    token: token
                });
                return response.data;
            } catch (error) {
                console.error('Error fetching user permissions:', error);
                throw error;
            }
        }

    },

    // Generate OTP

    // Reset Password
    Password: {
        resetPassword: async (email: string, newPassword: string) => {
            try {
                const response = await axios.post('/api/method/trainer.api.reset_password', {
                    email: email,
                    new_password: newPassword
                });
                return response.data;
            } catch (error) {
                console.error('Error resetting password:', error);
                throw error;
            }
        }
    }
}; 