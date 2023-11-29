const nodemailer = require('nodemailer');
const fs = require('fs');

exports.sendEmail = async (userEmail, qrCodes) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amir.sohail@brainvire.com',
                pass: process.env.API_KEY,
            },
        }); 
        const attachments = qrCodes.map(qrCode => ({
            filename: qrCode.filename,
            content: fs.createReadStream(qrCode.data),
        }));
        const mailOptions = {
            from: 'amir.sohail@brainvire.com',
            to: userEmail,
            subject: 'Your QR Codes',
            text: 'Please find your QR codes attached below:',
            attachments: attachments,
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('An error occurred while sending the email');
    }
};
exports.sendEmailURL = async (userEmail, qrCodes, url) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amir.sohail@brainvire.com',
                pass: process.env.API_KEY,
            },
        }); 
        const attachments = qrCodes.map(qrCode => ({
            filename: qrCode.filename,
            content: fs.createReadStream(qrCode.data),
        }));
        const mailOptions = {
            from: 'amir.sohail@brainvire.com',
            to: userEmail,
            subject: 'Your QR Codes',
            text: url,
            attachments: attachments,
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('An error occurred while sending the email');
    }
};