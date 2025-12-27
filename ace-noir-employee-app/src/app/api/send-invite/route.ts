import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, token, role } = await request.json()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Ace Noir Cleaning Services'
    const inviteUrl = `${appUrl}/invite?token=${token}`

    // If no Resend API key, log and return success (for development)
    if (!process.env.RESEND_API_KEY) {
      console.log('=== INVITE EMAIL (DEV MODE) ===')
      console.log(`To: ${email}`)
      console.log(`Role: ${role}`)
      console.log(`Invite URL: ${inviteUrl}`)
      console.log('================================')

      return NextResponse.json({
        success: true,
        message: 'Invite created (email not sent - no API key)',
        inviteUrl
      })
    }

    const { error } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: email,
      subject: `You're invited to join ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <div style="display: inline-block; background-color: #C9A86C; width: 60px; height: 60px; border-radius: 12px; line-height: 60px;">
                <span style="color: #1a1a1a; font-size: 24px; font-weight: bold;">AN</span>
              </div>
              <h1 style="color: white; margin: 20px 0 0 0; font-size: 24px;">${companyName}</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0;">You're Invited!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You've been invited to join the ${companyName} employee portal as a <strong style="color: #C9A86C;">${role}</strong>.
              </p>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to create your account and get started.
              </p>

              <!-- Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background-color: #C9A86C; color: #1a1a1a; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>

              <p style="color: #999; font-size: 14px; margin: 30px 0 0 0;">
                This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in send-invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
