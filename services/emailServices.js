const nodemailer = require('nodemailer');
const fs = require('fs');

exports.sendEmailURL = async (userEmail, qrCodes, url) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amir.sohail@brainvire.com',
                pass: process.env.API_KEY,
            },
        });

        // Create an HTML email template with improved design
        const emailTemplate = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 20px;
                            background-color: #f5f5f5;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        h2 {
                            color: #007bff;
                            margin-bottom: 20px;
                        }
                        p {
                            margin-bottom: 15px;
                            line-height: 1.5;
                        }
                        a {
                            color: #007bff;
                            text-decoration: none;
                            font-weight: bold;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                            margin-bottom: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Your QR Codes</h2>
                        <p>Please scan this QR to view the shared image. You can also view them online by clicking the link:</p>
                        <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
                        <p>QR Codes:</p>
                        ${qrCodes.map(qrCode => `<img src="cid:${qrCode.filename}" alt="${qrCode.filename}">`).join('')}
                    </div>
                </body>
            </html>
        `;

        const attachments = qrCodes.map(qrCode => ({
            filename: qrCode.filename,
            content: fs.createReadStream(qrCode.data),
            cid: qrCode.filename, // Attach image files as inline content IDs
        }));

        const mailOptions = {
            from: 'amir.sohail@brainvire.com',
            to: userEmail,
            subject: 'Your QR Codes',
            html: emailTemplate,
            attachments: attachments,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('An error occurred while sending the email');
    }
};
