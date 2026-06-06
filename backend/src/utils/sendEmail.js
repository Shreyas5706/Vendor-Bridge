import { Resend } from "resend";

export const sendEmail = async (email, otp) => {
  // Instantiate inside the function so dotenv has already loaded the env vars
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    // Force all emails to the verified Resend owner address during testing
    // to bypass the domain restriction error
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "rahulthapa9024@gmail.com",
      subject: "Vendor Bridge OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <div style="background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 5px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
            TEST MODE INTERCEPT: This email was originally meant to be sent to <strong>${email}</strong>
          </div>
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.log("Email Error:", error);
    throw error;
  }
};