"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getCurrentUserName, getCurrentUserRole, getCurrentUserMail } from '@/lib/utils/auth.utils';
import { creditsApis } from '@/lib/apis/credits.apis';

type User = {
    name: string;
    email: string;
    role: 'guest' | 'Trainer' | 'user_role';
    profilePic: string;
    isLoggedIn: boolean;
    credits?: number;
};

type UserContextType = {
    user: User;
    setUser: (user: User) => void;
    resetUser: () => void;
    setProfilePic: (profilePic: string) => void;
    setName: (name: string) => void;
    updateCredits: () => Promise<void>;
};

const defaultUser: User = {
    name: '',
    email: '',
    role: 'guest',
    profilePic: '',
    isLoggedIn: false,
    credits: 0
};

const UserContext = createContext<UserContextType | undefined>(undefined);



export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(() => {
        let profilePic = '';
        if (typeof window !== 'undefined') {
            // Try to get profilePic from user_details in localStorage
            const userDetailsRaw = localStorage.getItem('user_details');
            if (userDetailsRaw) {
                try {
                    const userDetails = JSON.parse(userDetailsRaw);
                    profilePic = userDetails.profilePic || '';
                } catch {
                    profilePic = localStorage.getItem('profilePic') || '';
                }
            } else {
                profilePic = localStorage.getItem('profilePic') || '';
            }
        }
        return { ...defaultUser, profilePic };
    });

    // Initialize user state and fetch credits if needed
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initializeUser = async () => {
            const name = getCurrentUserName();
            const email = getCurrentUserMail();
            const role = getCurrentUserRole();
            let profilePic = '';
            const userDetailsRaw = localStorage.getItem('user_details');
            if (userDetailsRaw) {
                try {
                    const userDetails = JSON.parse(userDetailsRaw);
                    profilePic = userDetails.profilePic || '';
                } catch {
                    profilePic = localStorage.getItem('profilePic') || '';
                }
            } else {
                profilePic = localStorage.getItem('profilePic') || '';
            }

            if (name && email && role) {
                const userData = {
                    name,
                    email,
                    role: role as 'guest' | 'Trainer' | 'user_role',
                    profilePic,
                    isLoggedIn: true,
                    credits: 0
                };

                setUser(userData);

                // Fetch credits immediately if user has user_role
                // Fetch credits for all users with valid credentials
                try {
                    const response = await creditsApis.getUserCredits();
                    if (response?.data?.length > 0) {
                        setUser(prev => ({
                            ...prev,
                            credits: response.data[0].credits
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching credits:", error);
                }
            } else {
                setUser(defaultUser);
            }
        };

        initializeUser();
    }, []); // Only run on mount

    const resetUser = () => {
        setUser(defaultUser);
    };

    const setProfilePic = (profilePic: string) => {
        setUser(prevUser => ({
            ...prevUser,
            profilePic
        }));
        if (typeof window !== 'undefined') {
            // Update profilePic in user_details in localStorage
            const userDetailsRaw = localStorage.getItem('user_details');
            if (userDetailsRaw) {
                try {
                    const userDetails = JSON.parse(userDetailsRaw);
                    userDetails.profilePic = profilePic;
                    localStorage.setItem('user_details', JSON.stringify(userDetails));
                } catch {
                    // fallback: just set profilePic key
                    localStorage.setItem('profilePic', profilePic);
                }
            } else {
                localStorage.setItem('profilePic', profilePic);
            }
        }
    };

    const setName = (name: string) => {
        setUser(prevUser => ({
            ...prevUser,
            name
        }));
    };

    const updateCredits = async () => {
        try {
            const response = await creditsApis.getUserCredits();
            if (response && response.data && response.data.length > 0) {
                setUser(prevUser => ({
                    ...prevUser,
                    credits: response.data[0].credits
                }));
            }
        } catch (error) {
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, resetUser, setProfilePic, setName, updateCredits }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
} 