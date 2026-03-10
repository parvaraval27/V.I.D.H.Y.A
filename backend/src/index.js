import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import { trainAndGet } from './assistant/nlpEngine.js';
import { globalLimiter, assistantLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting
app.use('/api', globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assistant', assistantLimiter, assistantRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Proxy endpoint for external contest APIs (to avoid CORS issues)
app.get('/api/contests/atcoder', async (req, res) => {
    try {
        const response = await fetch('https://atcoder.jp/contests/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (!response.ok) throw new Error(`AtCoder returned ${response.status}`);
        const html = await response.text();
        
        // Parse upcoming contests from the HTML
        // Look for the upcoming contests table and extract data
        const contests = [];
        
        // Match contest rows: start_time, contest link/name, duration
        // Pattern: <time class='fixtime fixtime-full'>2026-01-31 21:00:00+0900</time> ... <a href="/contests/abc443">Contest Name</a> ... duration
        const timeRegex = /<time[^>]*>(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[^<]*)<\/time>/g;
        const contestLinkRegex = /<a href="\/contests\/([^"]+)">([^<]+)<\/a>/g;
        const durationRegex = /<td class="text-center">(\d{2,3}:\d{2})<\/td>/g;
        
        // Find the upcoming contests section
        const upcomingMatch = html.match(/id="contest-table-upcoming"[\s\S]*?<\/table>/);
        if (upcomingMatch) {
            const upcomingHtml = upcomingMatch[0];
            
            // Extract all rows
            const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(upcomingHtml)) !== null) {
                const row = rowMatch[1];
                
                // Extract time
                const timeMatch = row.match(/<time[^>]*>(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})([^<]*)<\/time>/);
                // Extract contest link and name
                const linkMatch = row.match(/<a href="\/contests\/([^"]+)">([^<]+)<\/a>/);
                // Extract duration (format: HH:MM or HHH:MM)
                const durationMatch = row.match(/<td class="text-center">(\d+):(\d{2})<\/td>/);
                
                if (timeMatch && linkMatch) {
                    const startTimeStr = timeMatch[1]; // e.g., "2026-01-31 21:00:00"
                    const tzOffset = timeMatch[2] || '+0900'; // e.g., "+0900"
                    const contestCode = linkMatch[1];
                    const contestName = linkMatch[2];
                    
                    // Parse duration to seconds
                    let durationSeconds = 6000; // default 100 minutes
                    if (durationMatch) {
                        const hours = parseInt(durationMatch[1], 10);
                        const minutes = parseInt(durationMatch[2], 10);
                        durationSeconds = (hours * 60 + minutes) * 60;
                    }
                    
                    // Convert to ISO format
                    const isoTime = startTimeStr.replace(' ', 'T') + ':00' + tzOffset.replace('+', '+').replace(/(\d{2})(\d{2})/, '$1:$2');
                    
                    contests.push({
                        name: contestName,
                        url: `https://atcoder.jp/contests/${contestCode}`,
                        start_time: new Date(startTimeStr.replace(' ', 'T') + tzOffset).toISOString(),
                        duration: String(durationSeconds),
                        site: 'AtCoder',
                        status: 'BEFORE'
                    });
                }
            }
        }
        
        res.json(contests);
    } catch (e) {
        console.error('AtCoder scrape error:', e.message);
        res.status(502).json({ error: 'Failed to fetch AtCoder contests', details: e.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_demo';

const startServer = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        await trainAndGet();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

startServer();
