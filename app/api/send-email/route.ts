import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, type, message, storeName } = await req.json();

    // STRICT SMTP CONFIG FOR VERCEL: Do not use the generic "service: 'gmail'"
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: 'darlingjude9@gmail.com', 
        pass: 'vefa ibft raga pjge' // Your App Password
      }
    });

    const buttonText = type === 'welcome' ? 'COMPLETE YOUR REGISTRATION' : 'VIEW LATEST UPDATES';
    const siteUrl = 'https://shop-4-everything.vercel.app'; 

    // UoPeople-style Dark Theme HTML Template
    const htmlTemplate = `
      <div style="background-color: #1a1a1a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0d0d0d; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          
          <!-- Header -->
          <div style="text-align: center; padding: 30px 20px; border-bottom: 2px solid #333;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">${storeName}</h1>
            <p style="color: #ff3366; font-size: 13px; font-weight: bold; margin-top: 8px;">OFFICIAL NOTIFICATION</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #fff; margin-top: 0; font-size: 20px;">Dear Member,</h2>
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${message.replace(/\n/g, '<br/>')}
            </p>
            
            <!-- Call to Action Button (UoPeople Pink) -->
            <div style="text-align: center; margin-top: 40px;">
              <a href="${siteUrl}" style="display: inline-block; background-color: #ff3366; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: 800; font-size: 14px; text-transform: uppercase;">
                ${buttonText}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
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

    // VERCEL TIMEOUT FIX: Force the server to wait until the SMTP handshake completely finishes
    await new Promise((resolve, reject) => {
      transporter.verify(function(error, success) {
        if (error) {
          console.log("SMTP Connection Error:", error);
          reject(error);
        } else {
          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error('SMTP Send Error:', err);
              reject(err);
            } else {
              console.log('Email sent successfully:', info.response);
              resolve(info);
            }
          });
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Email dispatched successfully' });

  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}