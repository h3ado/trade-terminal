import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import tradesRouter from './routes/trades';
import accountsRouter from './routes/accounts';
import profilesRouter from './routes/profiles';
import preferencesRouter from './routes/preferences';
import savedSearchesRouter from './routes/saved-searches';
import customCompaniesRouter from './routes/custom-companies';
import optionTemplatesRouter from './routes/option-templates';
import optionAlertsRouter from './routes/option-alerts';
import quizAttemptsRouter from './routes/quiz-attempts';
import marketRouter from './routes/market';
import { startMarketSync } from './lib/marketSync';

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile, same-origin) and any localhost port in dev
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/trading-accounts', accountsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/saved-searches', savedSearchesRouter);
app.use('/api/custom-companies', customCompaniesRouter);
app.use('/api/option-strategy-templates', optionTemplatesRouter);
app.use('/api/option-alert-rules', optionAlertsRouter);
app.use('/api/quiz-attempts', quizAttemptsRouter);
app.use('/api/market', marketRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startMarketSync();
});
