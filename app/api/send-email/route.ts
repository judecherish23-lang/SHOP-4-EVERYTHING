import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, type, message, storeName } = await req.json();

    // Configure your actual Gmail SMTP here. 
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'darlingjude9@gmail.com', 
        pass: 'vefa ibft raga pjge' 
      }
    });

    const buttonText = type === 'welcome' ? 'ACCESS YOUR DASHBOARD' : 'VIEW LATEST UPDATES';
    const siteUrl = 'https://shop-4-everything.vercel.app'; 

    // Modern, UoPeople-style Dark Theme HTML Template
    const htmlTemplate = `
      <div style="background-color: #090d16; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header (Pink/Cyan Gradient Vibe) -->
          <div style="text-align: center; padding: 30px 20px; border-bottom: 3px solid #ff3366; background: linear-gradient(135deg, rgba(255,51,106,0.1), rgba(0,242,254,0.1));">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px;">${storeName}</h1>
            <p style="color: #00f2fe; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-top: 8px; letter-spacing: 2px;">Official Notification</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #fff; margin-top: 0; font-size: 20px;">${subject}</h2>
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${message.replace(/\n/g, '<br/>')}
            </p>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin-top: 40px;">
              <a href="${siteUrl}" style="display: inline-block; background-color: #ff3366; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                ${buttonText}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #030712; padding: 20px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
            <p style="color: #475569; font-size: 11px; margin-top: 8px;">You are receiving this because you are a registered member.</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${storeName}" <darlingjude9@gmail.com>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject: subject,
      html: htmlTemplate
    };

    // Vercel Serverless Fix: Wrap sendMail in a Promise to prevent premature timeout
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('SMTP Send Error:', err);
          reject(err);
        } else {
          console.log('Email sent successfully:', info.response);
          resolve(info);
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Email dispatched successfully' });

  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}