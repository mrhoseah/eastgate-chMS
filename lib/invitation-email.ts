import { sendEmail } from "./email";
import { getInvitationUrl } from "./invitations";
import { prisma } from "./prisma";

interface InvitationEmailData {
  invitation: {
    token: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    message?: string | null;
    expiresAt: Date;
  };
  invitedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  church?: {
    name: string;
  } | null;
}

/**
 * Generate HTML email template for invitation
 */
function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const { invitation, invitedBy, church } = data;
  const invitationUrl = getInvitationUrl(invitation.token);
  const inviterName = invitedBy
    ? `${invitedBy.firstName} ${invitedBy.lastName}`
    : "Administrator";
  const churchName = church?.name || "Church Management System";
  const roleDisplay = invitation.role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to ${churchName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hello <strong>${invitation.firstName} ${invitation.lastName}</strong>,
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${inviterName} has invited you to join <strong>${churchName}</strong> as a <strong>${roleDisplay}</strong>.
    </p>
    
    ${invitation.message ? `
    <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #1E40AF; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #4b5563;">
        "${invitation.message}"
      </p>
    </div>
    ` : ""}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationUrl}" 
         style="display: inline-block; background: #1E40AF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f9fafb; padding: 10px; border-radius: 4px; margin: 10px 0;">
      ${invitationUrl}
    </p>
    
    <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 12px; color: #6b7280; margin: 5px 0;">
        <strong>Role:</strong> ${roleDisplay}
      </p>
      <p style="font-size: 12px; color: #6b7280; margin: 5px 0;">
        <strong>Expires:</strong> ${new Date(invitation.expiresAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
    
    <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; text-align: center;">
      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} ${churchName}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for invitation
 */
function generateInvitationEmailText(data: InvitationEmailData): string {
  const { invitation, invitedBy, church } = data;
  const invitationUrl = getInvitationUrl(invitation.token);
  const inviterName = invitedBy
    ? `${invitedBy.firstName} ${invitedBy.lastName}`
    : "Administrator";
  const churchName = church?.name || "Church Management System";
  const roleDisplay = invitation.role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  return `
Hello ${invitation.firstName} ${invitation.lastName},

${inviterName} has invited you to join ${churchName} as a ${roleDisplay}.

${invitation.message ? `Message from ${inviterName}:\n"${invitation.message}"\n\n` : ""}
Accept your invitation by clicking the link below:
${invitationUrl}

Role: ${roleDisplay}
Expires: ${new Date(invitation.expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${churchName}. All rights reserved.
  `.trim();
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  invitationId: string,
  churchId?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Get invitation with related data
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        campus: {
          select: {
            church: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    // Get church ID from invitation if not provided
    if (!churchId) {
      churchId = invitation.campus?.church?.id;
    }

    // Get church name
    const churchName =
      invitation.campus?.church?.name ||
      (await prisma.church.findFirst({
        where: { isActive: true },
        select: { name: true },
      }))?.name ||
      "Church Management System";

    const emailData: InvitationEmailData = {
      invitation: {
        token: invitation.token,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
      },
      invitedBy: invitation.invitedBy,
      church: { name: churchName },
    };

    const subject = `You're Invited to Join ${churchName}`;
    const html = generateInvitationEmailHTML(emailData);
    const text = generateInvitationEmailText(emailData);

    const result = await sendEmail({
      to: invitation.email,
      subject,
      content: text,
      html,
    }, churchId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send invitation email",
      };
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return {
      success: false,
      error: error.message || "Failed to send invitation email",
    };
  }
}

