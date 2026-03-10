import rateLimit from 'express-rate-limit';

/* Global rate limiter — 100 requests / 15 minutes per IP.
Applied to all /api/* routes.
*/
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

/* Assistant rate limiter — 60 requests / 15 minutes per authenticated user.
Applied to /api/assistant/* routes.
*/
export const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || 'anon',
  message: { message: "You're sending messages too fast. Please slow down." },
});
