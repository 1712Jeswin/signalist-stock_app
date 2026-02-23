import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE, STOCK_ALERT_UPPER_EMAIL_TEMPLATE, STOCK_ALERT_LOWER_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Signalist" <signalist@jsmastery.pro>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist News" <signalist@jsmastery.pro>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendAlertEmail = async (
    { email, symbol, company, targetPrice, currentPrice, condition }: 
    { email: string; symbol: string; company: string; targetPrice: number; currentPrice: number; condition: 'greater_than' | 'less_than' }
): Promise<void> => {
    const template = condition === 'greater_than' ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    
    const timestamp = new Date().toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });

    const htmlTemplate = template
        .replace(/{{symbol}}/g, symbol)
        .replace(/{{company}}/g, company)
        .replace(/{{targetPrice}}/g, `$${targetPrice.toFixed(2)}`)
        .replace(/{{currentPrice}}/g, `$${currentPrice.toFixed(2)}`)
        .replace(/{{timestamp}}/g, timestamp);

    const conditionText = condition === 'greater_than' ? 'above' : 'below';

    const mailOptions = {
        from: `"Signalist Alerts" <signalist@jsmastery.pro>`,
        to: email,
        subject: `🚨 Alert Triggered: ${symbol} is ${conditionText} $${targetPrice}`,
        text: `Your price alert for ${symbol} was triggered. Current price: $${currentPrice}. Target price: $${targetPrice}.`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};