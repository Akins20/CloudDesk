import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import { LicenseTier, LICENSE_TIERS } from '../config/constants';
import { logger } from '../utils/logger';

// Create transporter (use test account in development)
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  if (env.NODE_ENV === 'production' && env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
    });
  } else {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`Using test email account: ${testAccount.user}`);
  }

  return transporter;
}

/**
 * Send license key email
 */
export async function sendLicenseKeyEmail(
  email: string,
  firstName: string,
  licenseKey: string,
  tier: LicenseTier
): Promise<void> {
  try {
    const transport = await getTransporter();
    const tierInfo = LICENSE_TIERS[tier];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000; margin: 0;">CloudDesk</h1>
            <p style="color: #666; margin: 5px 0 0;">Your License Key</p>
          </div>

          <p>Hi ${firstName},</p>

          <p>Thank you for subscribing to CloudDesk <strong>${tierInfo.name}</strong>! Your license key is ready.</p>

          <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Your License Key:</p>
            <code style="display: block; background: #000; color: #0f0; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px; word-break: break-all;">
              ${licenseKey}
            </code>
          </div>

          <h3>Getting Started</h3>
          <ol>
            <li>Open your CloudDesk <code>.env</code> file</li>
            <li>Add your license key:
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">LICENSE_KEY=${licenseKey}</pre>
            </li>
            <li>Restart your CloudDesk server</li>
          </ol>

          <h3>Your Plan Includes</h3>
          <ul>
            <li>Users: ${tierInfo.maxUsers === -1 ? 'Unlimited' : tierInfo.maxUsers}</li>
            <li>Instances: ${tierInfo.maxInstances === -1 ? 'Unlimited' : tierInfo.maxInstances}</li>
            <li>Concurrent Sessions: ${tierInfo.maxConcurrentSessions === -1 ? 'Unlimited' : tierInfo.maxConcurrentSessions}</li>
            ${tierInfo.features.auditLogs ? '<li>Audit Logs</li>' : ''}
            ${tierInfo.features.customBranding ? '<li>Custom Branding</li>' : ''}
            ${tierInfo.features.sso ? '<li>SSO Integration</li>' : ''}
            ${tierInfo.features.prioritySupport ? '<li>Priority Support</li>' : ''}
          </ul>

          <p>Need help? Visit our <a href="${env.CLOUDDESK_URL}/docs">documentation</a> or <a href="${env.PORTAL_URL}/support">contact support</a>.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 12px; color: #999; text-align: center;">
            CloudDesk - Remote Desktop Access<br>
            <a href="${env.CLOUDDESK_URL}" style="color: #666;">clouddesk.io</a>
          </p>
        </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `Your CloudDesk ${tierInfo.name} License Key`,
      html,
    });

    if (env.NODE_ENV !== 'production') {
      logger.info(`License key email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    logger.info(`License key email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send license key email to ${email}:`, error);
    // Don't throw - email failure shouldn't break the flow
  }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  email: string,
  firstName: string
): Promise<void> {
  try {
    const transport = await getTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000; margin: 0;">CloudDesk</h1>
          </div>

          <p>Hi ${firstName},</p>

          <p>We were unable to process your payment for CloudDesk. Your license has been temporarily suspended.</p>

          <p>To restore access, please update your payment method:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.PORTAL_URL}/dashboard" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Payment Method
            </a>
          </div>

          <p>If you have any questions, please <a href="${env.PORTAL_URL}/support">contact support</a>.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 12px; color: #999; text-align: center;">
            CloudDesk - Remote Desktop Access<br>
            <a href="${env.CLOUDDESK_URL}" style="color: #666;">clouddesk.io</a>
          </p>
        </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Action Required: CloudDesk Payment Failed',
      html,
    });

    if (env.NODE_ENV !== 'production') {
      logger.info(`Payment failed email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    logger.info(`Payment failed email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send payment failed email to ${email}:`, error);
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<void> {
  try {
    const transport = await getTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000; margin: 0;">Welcome to CloudDesk</h1>
          </div>

          <p>Hi ${firstName},</p>

          <p>Welcome to CloudDesk! Your account has been created successfully.</p>

          <p>CloudDesk provides secure remote desktop access to your cloud instances (EC2, OCI, and more) directly from your browser.</p>

          <h3>Next Steps</h3>
          <ul>
            <li><a href="${env.PORTAL_URL}/pricing">Choose a plan</a> that fits your needs</li>
            <li>After subscribing, you'll receive a license key</li>
            <li>Deploy CloudDesk to your infrastructure</li>
            <li>Start connecting to your instances!</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.PORTAL_URL}/dashboard" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>

          <p>Questions? Check our <a href="${env.CLOUDDESK_URL}/docs">documentation</a> or <a href="${env.PORTAL_URL}/support">contact support</a>.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 12px; color: #999; text-align: center;">
            CloudDesk - Remote Desktop Access<br>
            <a href="${env.CLOUDDESK_URL}" style="color: #666;">clouddesk.io</a>
          </p>
        </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Welcome to CloudDesk',
      html,
    });

    if (env.NODE_ENV !== 'production') {
      logger.info(`Welcome email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
  }
}
