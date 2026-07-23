import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, type, message, storeName } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "Missing RESEND_API_KEY on server" }, { status: 500 });
    }

    const buttonText = type === 'welcome' ? 'COMPLETE YOUR REGISTRATION' : 'VIEW LATEST UPDATES';
    const siteUrl = 'https://shop-4-everything.vercel.app'; 

    const htmlTemplate = `
      <div style="background-color: #1a1a1a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0d0d0d; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          <div style="text-align: center; padding: 30px 20px; border-bottom: 2px solid #333;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">${storeName || 'SHOP4EVERYTHING'}</h1>
            <p style="color: #ff3366; font-size: 13px; font-weight: bold; margin-top: 8px;">OFFICIAL NOTIFICATION</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #fff; margin-top: 0; font-size: 20px;">Dear Member,</h2>
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${message ? message.replace(/\n/g, '<br/>') : ''}
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <a href="${siteUrl}" style="display: inline-block; background-color: #ff3366; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: 800; font-size: 14px; text-transform: uppercase;">
                ${buttonText}
              </a>
            </div>
          </div>
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${storeName || 'SHOP4EVERYTHING'}. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    // Normalizing recipients (can be a single string or an array)
    const recipients = Array.isArray(to) ? to : [to];

    // Dispatch emails via Resend sandbox endpoint
    const emailPromises = recipients.map(recipient => 
      resend.emails.send({
        from: `SHOP4EVERYTHING <onboarding@resend.dev>`,
        to: [recipient],
        subject: subject || 'Store Update',
        html: htmlTemplate,
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({ success: true, message: 'Emails dispatched successfully' });

  } catch (error: any) {
    console.error('Resend Dispatch Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}