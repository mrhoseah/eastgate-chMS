import { prisma } from "./prisma";
import AfricasTalking from "africastalking";

interface SMSSettings {
  apiKey: string;
  username: string;
  senderId?: string; // Make optional
}

interface SendSMSOptions {
  to: string;
  message: string;
  recipientId?: string | null;
}

// Cache for Afrika's Talking client instances
let atClientCache: { [key: string]: any } = {};

/**
 * Get SMS settings from database
 */
async function getSMSSettings(churchId?: string): Promise<SMSSettings | null> {
  try {
    // Get church by ID if provided, otherwise get first active church
    const church = await prisma.church.findFirst({
      where: churchId ? { id: churchId } : { isActive: true },
      include: {
        settings: {
          where: {
            key: "sms",
          },
        },
      },
    });

    if (!church || !church.settings.length) return null;

    const smsSetting = church.settings[0];
    let smsData: any;

    // Parse JSON if type is json, otherwise parse the value
    if (smsSetting.type === "json") {
      try {
        smsData = JSON.parse(smsSetting.value);
      } catch {
        return null;
      }
    } else {
      // Try to parse as JSON anyway (for backwards compatibility)
      try {
        smsData = JSON.parse(smsSetting.value);
      } catch {
        return null;
      }
    }

    if (!smsData.apiKey || !smsData.username) {
      return null;
    }

    return {
      apiKey: smsData.apiKey,
      username: smsData.username,
      senderId: smsData.senderId || undefined, // Make sender ID optional
    };
  } catch (error) {
    console.error("Error fetching SMS settings:", error);
    return null;
  }
}

/**
 * Get or create Afrika's Talking client instance
 */
function getATClient(settings: SMSSettings) {
  const cacheKey = `${settings.username}:${settings.apiKey}`;
  
  if (!atClientCache[cacheKey]) {
    atClientCache[cacheKey] = AfricasTalking({
      apiKey: settings.apiKey,
      username: settings.username,
    });
  }
  
  return atClientCache[cacheKey];
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove + and whitespace
  let formatted = phoneNumber.replace(/^\+/, "").replace(/\s/g, "");
  
  // If number starts with 0, replace with country code (254 for Kenya)
  if (formatted.startsWith("0")) {
    formatted = "254" + formatted.substring(1);
  }
  
  // If number doesn't start with country code, assume Kenya (254)
  if (!formatted.startsWith("254") && !formatted.startsWith("+")) {
    formatted = "254" + formatted;
  }
  
  // Add + prefix for E.164 format
  return "+" + formatted;
}

/**
 * Send SMS via Afrika's Talking API
 */
export async function sendSMS(
  options: SendSMSOptions,
  churchId?: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log("[SMS] Attempting to send SMS to:", options.to);
    
    const settings = await getSMSSettings(churchId);

    if (!settings) {
      console.error("[SMS] No SMS settings found in database");
      return {
        success: false,
        error: "SMS settings not configured. Please configure Afrika's Talking in settings.",
      };
    }

    console.log("[SMS] Settings loaded for username:", settings.username);

    // Get Afrika's Talking client
    const client = getATClient(settings);
    const sms = client.SMS;

    // Format phone number
    const phoneNumber = formatPhoneNumber(options.to);
    console.log("[SMS] Formatted phone number:", phoneNumber);

    // Send SMS using the SDK
    console.log("[SMS] Sending SMS via Afrika's Talking SDK...");
    const sendOptions: any = {
      to: phoneNumber,
      message: options.message,
    };
    
    // Only add 'from' if senderId is provided and not empty
    if (settings.senderId && settings.senderId.trim()) {
      sendOptions.from = settings.senderId;
      console.log("[SMS] Using Sender ID:", settings.senderId);
    } else {
      console.log("[SMS] No Sender ID specified, using default");
    }
    
    const result = await sms.send(sendOptions);

    console.log("[SMS] Afrika's Talking response:", JSON.stringify(result, null, 2));

    // Check response
    if (result.SMSMessageData?.Recipients?.[0]) {
      const recipient = result.SMSMessageData.Recipients[0];
      const isSuccess = recipient.statusCode === 101 || recipient.status === "Success";
      
      console.log("[SMS] Recipient result - statusCode:", recipient.statusCode, "status:", recipient.status, "isSuccess:", isSuccess);
      
      return {
        success: isSuccess,
        messageId: recipient.messageId,
        error: !isSuccess ? recipient.status : undefined,
      };
    }

    console.error("[SMS] No recipient data in response");
    return {
      success: false,
      error: "No recipient data returned from Afrika's Talking",
    };
  } catch (error: any) {
    console.error("[SMS] Error sending SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
}

/**
 * Send bulk SMS messages
 * Uses the SDK to send messages more efficiently
 */
export async function sendBulkSMS(
  messages: SendSMSOptions[],
  churchId?: string
): Promise<{
  success: number;
  failed: number;
  results: Array<{
    to: string;
    success: boolean;
    error?: string;
    messageId?: string;
    recipientId?: string | null;
  }>;
}> {
  try {
    console.log(`[SMS Bulk] Processing ${messages.length} messages`);
    
    const settings = await getSMSSettings(churchId);

    if (!settings) {
      console.error("[SMS Bulk] No SMS settings configured");
      // If no settings, return all as failed
      return {
        success: 0,
        failed: messages.length,
        results: messages.map((msg) => ({
          to: msg.to,
          success: false,
          error: "SMS settings not configured",
          recipientId: msg.recipientId ?? null,
        })),
      };
    }

    console.log("[SMS Bulk] Settings loaded, grouping messages...");

    // Get Afrika's Talking client
    const client = getATClient(settings);
    const sms = client.SMS;

    // Group messages by content for more efficient sending
    const messageGroups = messages.reduce((acc, msg) => {
      if (!acc[msg.message]) {
        acc[msg.message] = [];
      }
      acc[msg.message].push(msg);
      return acc;
    }, {} as Record<string, SendSMSOptions[]>);

    console.log(`[SMS Bulk] Created ${Object.keys(messageGroups).length} message groups`);

    const allResults: Array<{
      to: string;
      success: boolean;
      error?: string;
      messageId?: string;
      recipientId?: string | null;
    }> = [];

    // Send each group of messages with same content
    for (const [messageContent, recipientList] of Object.entries(messageGroups)) {
      try {
        console.log(`[SMS Bulk] Sending to ${recipientList.length} recipients with message: "${messageContent.substring(0, 50)}..."`);
        
        // Format all phone numbers
        const phoneNumbers = recipientList.map((msg) => formatPhoneNumber(msg.to));
        console.log("[SMS Bulk] Formatted numbers:", phoneNumbers);

        // Prepare send options
        const sendOptions: any = {
          to: phoneNumbers,
          message: messageContent,
        };
        
        // Only add 'from' if senderId is provided and not empty
        if (settings.senderId && settings.senderId.trim()) {
          sendOptions.from = settings.senderId;
          console.log("[SMS Bulk] Using Sender ID:", settings.senderId);
        } else {
          console.log("[SMS Bulk] No Sender ID specified, using default");
        }

        // Send bulk SMS
        const result = await sms.send(sendOptions);

        console.log("[SMS Bulk] Afrika's Talking bulk response:", JSON.stringify(result, null, 2));

        // Process results
        if (result.SMSMessageData?.Recipients) {
          result.SMSMessageData.Recipients.forEach((recipient: any, index: number) => {
            const isSuccess = recipient.statusCode === 101 || recipient.status === "Success";
            console.log(`[SMS Bulk] Recipient ${index}: statusCode=${recipient.statusCode}, status=${recipient.status}, isSuccess=${isSuccess}`);
            
            allResults.push({
              to: recipientList[index].to,
              success: isSuccess,
              error: !isSuccess ? recipient.status : undefined,
              messageId: recipient.messageId,
              recipientId: recipientList[index].recipientId ?? null,
            });
          });
        } else {
          // Check if it's an InvalidSenderId error
          const errorMessage = result.SMSMessageData?.Message || "No recipient data returned";
          console.error("[SMS Bulk] No recipient data in response. Error:", errorMessage);
          
          // Provide helpful error message for InvalidSenderId
          let userFriendlyError = errorMessage;
          if (errorMessage === "InvalidSenderId") {
            userFriendlyError = `Invalid Sender ID "${settings.senderId}". Use "AFRICASTKNG" for sandbox or register your sender ID in Afrika's Talking dashboard.`;
          }
          
          // No recipient data, mark all as failed
          recipientList.forEach((msg) => {
            allResults.push({
              to: msg.to,
              success: false,
              error: userFriendlyError,
              recipientId: msg.recipientId ?? null,
            });
          });
        }
      } catch (error: any) {
        console.error("[SMS Bulk] Error sending bulk SMS group:", error);
        // Mark this group as failed
        recipientList.forEach((msg) => {
          allResults.push({
            to: msg.to,
            success: false,
            error: error.message || "Failed to send SMS",
            recipientId: msg.recipientId ?? null,
          });
        });
      }
    }

    const successCount = allResults.filter((r) => r.success).length;
    const failedCount = allResults.filter((r) => !r.success).length;

    console.log(`[SMS Bulk] Final results: ${successCount} success, ${failedCount} failed`);

    return {
      success: successCount,
      failed: failedCount,
      results: allResults,
    };
  } catch (error: any) {
    console.error("[SMS Bulk] Error in sendBulkSMS:", error);
    // Return all as failed
    return {
      success: 0,
      failed: messages.length,
      results: messages.map((msg) => ({
        to: msg.to,
        success: false,
        error: error.message || "Failed to send bulk SMS",
        recipientId: msg.recipientId ?? null,
      })),
    };
  }
}

