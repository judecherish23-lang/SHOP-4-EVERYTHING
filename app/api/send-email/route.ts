import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, type, message, storeName } = await req.json();

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
          </div>
        </div>
      </div>
    `;

    const data = await resend.emails.send({
      from: `${storeName} <onboarding@resend.dev>`, // Replace with your domain once verified on Resend
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Resend API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}