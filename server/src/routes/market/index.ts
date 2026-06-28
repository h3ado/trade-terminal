import { Router } from 'express';
import forexRouter from './forex';
import indicesRouter from './indices';
import macroRouter from './macro';
import cotRouter from './cot';
import eventsRouter from './events';
import newsRouter from './news';
import calendarRouter from './calendar';
import optionsRouter from './options';
import securityRouter from './security';
import cryptoRouter from './crypto';
import scannerRouter from './scanner';

const router = Router();

router.use('/crypto', cryptoRouter);
router.use('/forex', forexRouter);
router.use('/indices', indicesRouter);
router.use('/macro', macroRouter);
router.use('/cot', cotRouter);
router.use('/events', eventsRouter);
router.use('/news', newsRouter);
router.use('/calendar', calendarRouter);
router.use('/options', optionsRouter);
router.use('/security', securityRouter);
router.use('/scanner', scannerRouter);

export default router;
