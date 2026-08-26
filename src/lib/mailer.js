import axios from 'axios';
import { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } from './secret';

export async function sendEmail({ to, subject, htmlContent }) {
  if (!BREVO_API_KEY || BREVO_API_KEY.includes('xxxxxx')) {
    console.warn("BREVO_API_KEY is not defined or is a placeholder. Logging email content to console:");
    console.log("=========================================");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:`);
    console.log(htmlContent);
    console.log("=========================================");
    return { mock: true, success: true };
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending email via Brevo:", error.response?.data || error.message);
    throw error;
  }
}
