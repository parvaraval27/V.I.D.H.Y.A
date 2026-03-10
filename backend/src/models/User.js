import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    verificationCode: String,
    resetToken: String,
    resetTokenExpiry: Date,

    // ========== PROFILE FIELDS ==========
    
    // Basic Profile
    profile: {
        displayName: { type: String, default: '' },
        bio: { type: String, default: '' },
        avatarUrl: { type: String, default: '' },
        avatarEmoji: { type: String, default: '👨‍💻' }
    },

    // Academic Info
    academic: {
        institution: { type: String, default: '' },
        major: { type: String, default: '' },
        year: { type: String, default: '' }, // e.g., "3rd Year", "Junior"
        expectedGraduation: { type: String, default: '' } // e.g., "May 2025"
    },

    // Career Goals
    career: {
        dreamRole: { type: String, default: '' },
        targetCompanies: [{ type: String }],
        shortTermGoals: { type: String, default: '' },
        longTermGoals: { type: String, default: '' }
    },

    // Coding Profiles (Social Links)
    codingProfiles: {
        leetcode: { type: String, default: '' },
        codeforces: { type: String, default: '' },
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        twitter: { type: String, default: '' }
    },

    // Skills & Interests
    skills: {
        languages: [{ type: String }],
        frameworks: [{ type: String }],
        tools: [{ type: String }],
        hobbies: [{ type: String }]
    },

    // Study Preferences
    studyPreferences: {
        preferredTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], default: 'morning' },
        dailyGoalHours: { type: Number, default: 4 },
        focusMode: { type: Boolean, default: false }
    },

    // Theme Preferences
    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
        notificationsEnabled: { type: Boolean, default: true }
    },

    // Assistant Usage Tracking (LLM budget)
    assistantUsage: {
        llmCallsToday: { type: Number, default: 0 },
        llmLastReset: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
