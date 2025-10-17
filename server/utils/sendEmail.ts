import { Resend } from 'resend';

// Check if sandbox mode is enabled
const USE_SANDBOX_MODE = process.env.USE_SANDBOX_MODE === 'true';

function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.');
  }

  // In sandbox mode, always use Resend's sandbox email
  // In production mode, use custom domain email (if provided)
  const fromEmail = USE_SANDBOX_MODE 
    ? 'onboarding@resend.dev' 
    : (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev');

  return { apiKey, fromEmail };
}

function getResendClient() {
  const { apiKey, fromEmail } = getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

/**
 * Send an email using Resend
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param htmlContent - HTML content of the email
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = getResendClient();

    // Log sandbox mode status
    if (USE_SANDBOX_MODE) {
      console.log('📧 Sending email in SANDBOX mode (using onboarding@resend.dev)');
    }

    const result = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', {
      to,
      subject,
      from: fromEmail,
      mode: USE_SANDBOX_MODE ? 'sandbox' : 'production',
      emailId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email:', {
      to,
      subject,
      mode: USE_SANDBOX_MODE ? 'sandbox' : 'production',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
