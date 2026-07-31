import nodemailer from 'nodemailer';
import env from '../../config/env.js';

let transporter = null;

function getTransporter() {
    if (!env.mail.host || !env.mail.user || !env.mail.password) {
        return null;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.mail.host,
            port: env.mail.port,
            secure: env.mail.port === 465,
            auth: { user: env.mail.user, pass: env.mail.password }
        });
    }

    return transporter;
}

// If SMTP isn't configured, logs the email instead of sending it rather
// than throwing — a school self-hosting this shouldn't lose password
// reset entirely just because nobody's set up SMTP yet, and a developer
// running locally gets the reset link right in their terminal. Same
// "fail soft, never block the feature" reasoning as
// document-preview.helper.js when LibreOffice isn't installed.
export async function sendEmail({ to, subject, html, text }) {
    const activeTransporter = getTransporter();

    if (!activeTransporter) {
        console.log(`[mailer] SMTP not configured — logging email instead of sending it.
To: ${to}
Subject: ${subject}
${text || html}`);
        return { delivered: false };
    }

    await activeTransporter.sendMail({
        from: env.mail.fromAddress,
        to,
        subject,
        html,
        text
    });

    return { delivered: true };
}
