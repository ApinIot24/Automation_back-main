import nodemailer from 'nodemailer';
import cron from 'node-cron';

// Konfigurasi nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

// Simpan informasi tentang jadwal cron
const schedules = [];

// Fungsi untuk mengirim email
const sendEmail = () => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'recipient-email@example.com',
        subject: 'Update Mingguan',
        text: `Ini adalah pesan otomatis untuk minggu ke-${getCurrentWeekNumber()}.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(`Error: ${error}`);
        }
        console.log(`Email sent: ${info.response}`);
    });
};

// Fungsi untuk mendapatkan nomor minggu saat ini
const getCurrentWeekNumber = () => {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Menjadwalkan pengiriman email setiap Senin jam 9 pagi
const job = cron.schedule('0 9 * * 1', () => {
    console.log('Mengirim email mingguan...');
    sendEmail();
});

// Menyimpan informasi tentang job
schedules.push({
    name: 'Weekly Email',
    cronTime: '0 9 * * 1'
});

// Fungsi untuk mendapatkan daftar job yang dijadwalkan
const getScheduledJobs = () => {
    return schedules;
};

// Ekspor fungsi yang diperlukan
export default { sendEmail, getScheduledJobs };
