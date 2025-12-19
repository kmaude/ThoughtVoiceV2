import { ContentItem, UserProfile, TeamMember } from "../types";
import { db } from "./database";
import { APP_CONFIG } from "../config";

export const notificationService = {
  notifyWelcome: async (user: UserProfile, dashboardUrl: string, schedule: Date[]) => {
    console.log(`📧 [WELCOME EMAIL] Sent to ${user.contact.primary.email}`);
    console.log(`   Subject: Welcome to ${APP_CONFIG.PLATFORM_NAME} - Your Strategic HQ is Ready`);
    console.log(`   Body: Welcome ${user.name}! Access your unique dashboard at ${dashboardUrl}.`);
    console.log(`   Delivery Forecast: ${schedule.map(d => d.toLocaleDateString()).join(', ')}`);
    
    const scheduleList = schedule.map(d => `• ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`).join('\n');
    const emailBody = `Welcome to ${APP_CONFIG.PLATFORM_NAME}, ${user.name}!\n\nYour Strategic Dashboard: ${dashboardUrl}\n\nDelivery Forecast for the next 2 weeks:\n${scheduleList}`;
    
    await db.logNotification(user.id, 'EMAIL', emailBody);
    return true;
  },

  notifyNewSubmission: async (user: UserProfile, content: ContentItem) => {
    console.log("🔔 [NOTIFY] New Video Submission");
    console.log(`   User: ${user.name}`);
    console.log(`   Title: ${content.title}`);
    await db.logNotification(user.id, 'EMAIL', `Submission Received: ${content.title}. Tracking ID: ${content.id}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
  },

  notifyAssignment: async (content: ContentItem, assignee: TeamMember) => {
    console.log(`🔔 [NOTIFY] Task Assigned`);
    console.log(`   To: ${assignee.name} (${assignee.email})`);
    console.log(`   Item: ${content.title}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  },
  
  notifyAccountManager: async (amId: string, message: string) => {
    console.log(`🔔 [NOTIFY AM] To ${amId}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  notifyReviewReady: async (user: UserProfile, content: ContentItem) => {
    console.log(`🔔 [NOTIFY] Content Ready for Review`);
    console.log(`   To Client: ${user.contact.primary.email}`);
    
    // Log Email
    const emailBody = `
      Prompt: ${content.promptContext || 'N/A'}
      Context Bullets:
      - Review tone consistency
      - Check facts
      Link: https://thoughtvoice.app/review/${content.id}
    `;
    await db.logNotification(user.id, 'EMAIL', emailBody);

    // Log SMS (Mock)
    if (user.contact.preferredChannel !== 'EMAIL') {
       const smsBody = `ThoughtVoice: Your content "${content.title}" is ready for review. https://thoughtvoice.app/review/${content.id}`;
       await db.logNotification(user.id, 'SMS', smsBody);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  },

  sendTestSMS: async (phone: string): Promise<boolean> => {
    console.log(`📱 [SMS TEST] Sending to ${phone}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`✅ [SMS TEST] Delivered: "ThoughtVoice Verification Code: 1234"`);
    return true;
  },

  notifyMention: async (text: string, content: ContentItem, authorName: string) => {
    console.log(`🔔 [NOTIFY] Mention detected`);
    console.log(`   Author: ${authorName}`);
    console.log(`   Content: ${content.title}`);
    console.log(`   Message: ${text}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  notifyStaffOnboarding: async (email: string, tempPass: string) => {
    console.log(`📧 [STAFF INVITE] Sent to ${email}`);
    console.log(`   Subject: Complete your ThoughtVoice Staff Profile`);
    console.log(`   Body: Login with ${email} / ${tempPass} to upload W9/Docs.`);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  notifyAdminInvoice: async (staffName: string, amount: number) => {
    console.log(`💰 [ADMIN ALERT] New Invoice Submitted`);
    console.log(`   From: ${staffName}`);
    console.log(`   Amount: $${amount}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};