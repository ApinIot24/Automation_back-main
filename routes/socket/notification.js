import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Memungkinkan koneksi dari semua domain
    },
});

// Event koneksi Socket.IO
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Event untuk menangani disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Cron job untuk mengirim notifikasi setiap menit
cron.schedule('* * * * *', () => {
    const payload = {
        title: 'Notifikasi Terjadwal',
        body: 'Ini adalah notifikasi yang dikirim setiap menit.',
    };
    io.emit('notification', payload); // Kirim notifikasi ke semua klien
    console.log('Notifikasi dikirim:', payload);
});
