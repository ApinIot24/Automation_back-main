import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "cahyospprt@gmail.com", // email pengirim
        pass: "xkwojxzaccrorerw", // App password Gmail, bukan password biasa
    },
})

export default transporter;
