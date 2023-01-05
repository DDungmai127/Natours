/* eslint-disable */
const nodemailer = require('nodemailer'); // cái này log bằng github nhé
const pug = require('pug');
const htmlToText = require('html-to-text');
sendGridTransport = require('nodemailer-sendgrid-transport');
// SENDing email with nodemailer

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[-1];
        this.url = url;
        this.from =
            process.env.NODE_ENV === 'production'
                ? `Nguyen Dang Dung <${process.env.SENDGRID_EMAIL_FROM}>`
                : `Jonas Schemedtmann <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid
            return nodemailer.createTransport(
                sendGridTransport({
                    auth: {
                        api_key: process.env.SENDGRID_PASSWORD,
                    },
                })
            );
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // send the actual email
    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        );

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html),
        };

        // 3) create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours family!');
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes'
        );
    }
};
