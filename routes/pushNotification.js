// routes/pushNotification.js

import express from 'express';
import webpush from 'web-push';
import cron from 'node-cron';

const router = express.Router();

// Gantilah dengan kunci publik dan pribadi yang valid
const vapidKeys = {
    publicKey: 'BCvX9pd8rlHf0VqcYllIfUG61MRn5TOsoTDDNDDzie83dDMZUAMCHPUE_DSypKQSHWI3jXAW0zGtba1SEgz-ex4', // Masukkan kunci publik di sini
    privateKey: 'Z1Sb2KYZJ1EVI2Ncz0Z7oz_uzmmbbBJgkjXaxCh2CFQ' // Masukkan kunci pribadi di sini
};

// Set VAPID details
webpush.setVapidDetails(
    'mailto:dwicahyo.1512@gmail.com', // Ganti dengan email Anda
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
// Tempat untuk menyimpan subscriptions
let subscriptions = {};

cron.schedule('* * * * *', () => {
    const payload = JSON.stringify({
        title: "Notifikasi Per Menit!",
        body: "Ini adalah pesan notifikasi yang dikirim setiap menit."
    });

    // Kirim notifikasi ke semua pengguna yang terdaftar
    for (const username in subscriptions) {
        const subscription = subscriptions[username];
        webpush.sendNotification(subscription, payload)
            .then(response => {
                console.log(`Notifikasi terkirim kepada ${username}:`, response);
            })
            .catch(error => {
                console.error(`Error mengirim notifikasi kepada ${username}:`, error);
            });
    }
});
// Endpoint untuk menerima subscription dari klien
router.post('/subscribe', (req, res) => {
    const { username, subscription } = req.body;

    // Simpan subscription dengan username
    subscriptions[username] = subscription;
    console.log(`Subscription received for ${username}:`, subscription);
    res.status(201).json({});
});

// Rute untuk mengirim notifikasi
router.post('/send-notification', (req, res) => {
    const { username, payload } = req.body;
    // Ambil subscription berdasarkan username
    const subscription = subscriptions[username];
    if (subscription) {
        // Kirim notifikasi ke subscription yang ditemukan
        webpush.sendNotification(subscription, payload)
            .then(response => {
                console.log("Notifikasi terkirim:", response);
                res.status(200).json({ message: 'Notifikasi dikirim' });
            })
            .catch(error => {
                console.error("Error mengirim notifikasi:", error);
                res.sendStatus(500);
            });
    } else {
        console.log(`No subscription found for ${username}`);
        res.status(404).json({ message: 'Subscription not found' });
    }
});
router.get('/packing_l5', async (req, res) => {
    const result = await req.db.query('SELECT * FROM automation.packing_l5 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
export default router;