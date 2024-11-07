// routes/emailRoutes.js
import { Router } from 'express';
import emailController from '../../controllers/emailController.js';

const router = Router();

// Route untuk mengirim email manual
router.get('/send-email', (req, res) => {
    emailController.sendEmail();
    res.send('Email berhasil dikirim.');
});

// Route untuk melihat jadwal cron
router.get('/scheduled-jobs', (req, res) => {
    const jobs = emailController.getScheduledJobs();
    res.json(jobs);
});

export default router;
