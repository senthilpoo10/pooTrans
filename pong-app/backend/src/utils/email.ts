// // backend/src/utils/email.ts
// // Email utility functions
// import nodemailer from 'nodemailer';
// import env from '../env';

// const transporter = nodemailer.createTransport({
//   service: env.EMAIL_SERVICE,
//   auth: {
//     user: env.EMAIL_USER,
//     pass: env.EMAIL_PASSWORD
//   }
// });

// export async function sendVerificationEmail(to: string, code: string): Promise<void> {
//   try {
//     await transporter.sendMail({
//       from: `${env.TEAM_NAME} <${env.EMAIL_FROM}>`,
//       to,
//       subject: 'Verify Your Email Address',
//       text: `Your verification code is: ${code}\n\nThis code will expire in 24 hours.`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #2563eb;">Email Verification</h2>
//           <p>Your verification code is:</p>
//           <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #2563eb;">
//             ${code}
//           </div>
//           <p>This code will expire in 24 hours.</p>
//           <p>If you didn't request this, please ignore this email.</p>
//         </div>
//       `
//     });
//   } catch (error) {
//     console.error('Error sending verification email:', error);
//     throw new Error('Failed to send verification email');
//   }
// }

// export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
//   try {
//     await transporter.sendMail({
//       from: `${env.TEAM_NAME} <${env.EMAIL_FROM}>`,
//       to,
//       subject: 'Reset your password',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #2563eb;">Reset Password</h2>
//           <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
//           <p>This link will expire in 24 hours.</p>
//           <p>If you didn't request this, please ignore this email.</p>
//         </div>
//       `
//     });
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     throw new Error('Failed to send password reset email');
//   }
// }



// backend/src/utils/email.ts
import nodemailer from 'nodemailer';
import env from '../env';

const transporter = nodemailer.createTransport({
  service: env.EMAIL_SERVICE,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD
  }
});

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: `${env.TEAM_NAME} <${env.EMAIL_FROM}>`,
      to,
      subject: 'Verify Your Email Address',
      text: `Your verification code is: ${code}\n\nThis code will expire in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #2563eb;">
            ${code}
          </div>
          <p>This code will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendTwoFactorCode(to: string, code: string, username: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: `${env.TEAM_NAME} <${env.EMAIL_FROM}>`,
      to,
      subject: 'Your Login Verification Code',
      text: `Hello ${username},\n\nYour login verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't try to log in, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Login Verification</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Your login verification code is:</p>
          <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">
              ${code.toUpperCase()}
            </div>
          </div>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't try to log in, please ignore this email and consider changing your password.</p>
          <hr style="border: none; height: 1px; background-color: #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated message from ${env.TEAM_NAME}. Please do not reply to this email.
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    throw new Error('Failed to send 2FA code');
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: `${env.TEAM_NAME} <${env.EMAIL_FROM}>`,
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset Password</h2>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendRegisterSuccessEmail(to: string, username: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: `${env.TEAM_NAME} <${env.EMAIL_FROM}>`,
      to,
      subject: 'Welcome to the Game!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Welcome to ${env.TEAM_NAME}!</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Your account has been successfully created! 🎉</p>
          <p>You can now log in and start playing our amazing games.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.FRONTEND_URL}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Playing</a>
          </div>
          <p>Thank you for joining us!</p>
          <hr style="border: none; height: 1px; background-color: #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated message from ${env.TEAM_NAME}. Please do not reply to this email.
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}