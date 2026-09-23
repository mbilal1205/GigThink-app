export function getOTPEmailTemplate(otp: string, name?: string): string {
  const displayName = name ? ` ${name},` : '';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:600px; margin: auto; background-color:#ffffff; border-radius:12px; margin-top:40px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
      <tr>
        <td align="center" style="padding:40px 30px 20px;">
          <img src="https://yourdomain.com/gigwaitelogo.jpeg" alt="GigThink" width="64" style="display:block; margin:0 auto;" />
          <h1 style="font-size:24px; color:#1a1a1a; margin:20px 0 0;">Password Reset OTP</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 30px 30px;">
          <p style="font-size:16px; color:#333; line-height:1.5;">
            Hi${displayName}
          </p>
          <p style="font-size:16px; color:#333; line-height:1.5;">
            You requested to reset your password for your GigThink account. Use the OTP below to proceed:
          </p>
          <div style="text-align:center; margin:30px 0;">
            <span style="display:inline-block; background:#f0f0f0; padding:15px 30px; border-radius:8px; font-size:32px; letter-spacing:10px; font-weight:bold; color:#000; border:1px dashed #ccc;">${otp}</span>
          </div>
          <p style="font-size:14px; color:#666; line-height:1.5;">
            This OTP is valid for <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
          </p>
          <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />
          <p style="font-size:12px; color:#999; text-align:center;">
            Need help? Contact our support team.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export function getWelcomeEmailTemplate(
  name: string,
  preferences?: {
    skills?: string[];
    experience_level?: string;
    min_budget?: number;
    preferred_markets?: string[];
    opportunity_types?: string[];
    target_client?: string[];
  }
): string {
  const skills = preferences?.skills?.length ? preferences.skills.join(', ') : 'Not specified';
  const experience = preferences?.experience_level || 'Not specified';
  const budget = preferences?.min_budget ? `$${preferences.min_budget}` : 'Not specified';
  const markets = preferences?.preferred_markets?.length ? preferences.preferred_markets.join(', ') : 'Any';
  const oppTypes = preferences?.opportunity_types?.length ? preferences.opportunity_types.join(', ') : 'Any';
  const clients = preferences?.target_client?.length ? preferences.target_client.join(', ') : 'Any';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to GigThink</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:600px; margin: auto; background-color:#ffffff; border-radius:12px; margin-top:40px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
      <tr>
        <td align="center" style="padding:40px 30px 20px;">
          <img src="https://yourdomain.com/gigwaitelogo.jpeg" alt="GigThink" width="64" style="display:block; margin:0 auto;" />
          <h1 style="font-size:24px; color:#1a1a1a; margin:20px 0 0;">Welcome to GigThink! </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 30px 30px;">
          <p style="font-size:16px; color:#333; line-height:1.5;">
            Hi ${name},
          </p>
          <p style="font-size:16px; color:#333; line-height:1.5;">
            Your account is now fully set up and ready to help you win clients.
          </p>
          
          <h2 style="font-size:18px; color:#596cf5; margin:30px 0 10px; border-bottom:1px solid #eee; padding-bottom:5px;">
            Your Opportunity Preferences
          </h2>
          <table style="width:100%; border-collapse:collapse; font-size:14px; color:#333;">
            <tr>
              <td style="padding:8px 0; font-weight:bold; width:40%;">Skills</td>
              <td style="padding:8px 0;">${skills}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Experience Level</td>
              <td style="padding:8px 0;">${experience}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Minimum Budget</td>
              <td style="padding:8px 0;">${budget}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Preferred Markets</td>
              <td style="padding:8px 0;">${markets}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Opportunity Types</td>
              <td style="padding:8px 0;">${oppTypes}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Target Clients</td>
              <td style="padding:8px 0;">${clients}</td>
            </tr>
          </table>

          <p style="font-size:16px; color:#333; line-height:1.5; margin-top:20px;">
            Start exploring opportunities and generating winning proposals!
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/" style="display:inline-block; background-color:#596cf5; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:5px; margin-top:10px; font-weight:bold;">Go to Dashboard</a>
          
          <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />
          <p style="font-size:12px; color:#999; text-align:center;">
            © ${new Date().getFullYear()} GigThink. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}