const axios = require("axios");

/**
 * ============================================================================
 * WHATSAPP SERVICE
 * ============================================================================
 * This file is the ONLY place that talks to Meta's WhatsApp Business Cloud
 * API. Credentials are read from environment variables — never hardcode them
 * here and never send them to the frontend.
 *
 *   WHATSAPP_ACCESS_TOKEN        <- backend/.env
 *   WHATSAPP_PHONE_NUMBER_ID     <- backend/.env
 *   WHATSAPP_BUSINESS_ACCOUNT_ID <- backend/.env (not required for sending
 *                                   messages, but kept for future use e.g.
 *                                   managing message templates via the API)
 *
 * Two distinct paths are exposed, matching what the brief asked for:
 *
 *   1. isConfigured() / sendViaCloudApi()  -> AUTOMATIC sending through the
 *      real WhatsApp Business Cloud API. Used by the daily reminder
 *      scheduler and by "Send WhatsApp" when credentials exist.
 *
 *   2. buildManualLink()                   -> MANUAL fallback. Builds a
 *      https://wa.me/... link with the message pre-filled. The user clicks
 *      it and WhatsApp opens with the message ready to send. Used whenever
 *      credentials are missing, and always available as an option.
 *
 * IMPORTANT REAL-WORLD NOTE ON PROACTIVE MESSAGES
 * ------------------------------------------------
 * WhatsApp only allows free-form text messages within a 24-hour "customer
 * service window" after the customer last messaged you. A gym membership
 * reminder is a business-initiated (proactive) message sent outside that
 * window, so Meta requires it to use a pre-approved MESSAGE TEMPLATE
 * (create one in WhatsApp Manager > Account Tools > Message Templates,
 * e.g. named "membership_expiry_reminder" with {{1}} = name, {{2}} = date,
 * {{3}} = gym name). That's why sendViaCloudApi() below sends a
 * "template" message by default. sendFreeTextViaCloudApi() is included too,
 * for testing with numbers that have an open session — swap which one
 * reminderScheduler.js calls once your template is approved and you know
 * its exact name/variable order.
 * ============================================================================
 */

const GRAPH_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

function isConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

/** Strips spaces, dashes, parentheses and a leading "+" so the number matches
 *  the digits-only format both the Cloud API and wa.me links expect. */
function normalizePhone(phone) {
  return String(phone).replace(/[^\d]/g, "");
}

/** Replaces {memberName}, {expiryDate}, {gymName} in a template string. */
function fillTemplate(template, { memberName, expiryDate, gymName }) {
  return template
    .replaceAll("{memberName}", memberName)
    .replaceAll("{expiryDate}", expiryDate)
    .replaceAll("{gymName}", gymName);
}

/** Builds a wa.me deep link that pre-fills the message. User still has to hit send. */
function buildManualLink(phone, message) {
  const digits = normalizePhone(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * AUTOMATIC path — sends a pre-approved WhatsApp message TEMPLATE via the
 * Cloud API. This is the correct way to send a proactive reminder outside
 * the 24-hour session window.
 *
 * Update `templateName` / `languageCode` to match exactly what you created
 * and got approved in WhatsApp Manager.
 */
async function sendTemplateMessage({
  to,
  templateName = "membership_expiry_reminder",
  languageCode = "en",
  bodyParams = [], // e.g. [memberName, expiryDate, gymName] in the order your template's {{1}} {{2}} {{3}} use
}) {
  if (!isConfigured()) {
    throw new Error(
      "WhatsApp Cloud API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env"
    );
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: bodyParams.length
        ? [
            {
              type: "body",
              parameters: bodyParams.map((text) => ({ type: "text", text: String(text) })),
            },
          ]
        : [],
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data; // { messages: [{ id: "wamid...." }], ... }
}

/**
 * AUTOMATIC path (alternative) — sends a free-form text message via the
 * Cloud API. Only works if the member messaged your WhatsApp business
 * number in the last 24 hours. Useful during development/testing.
 */
async function sendFreeTextViaCloudApi({ to, message }) {
  if (!isConfigured()) {
    throw new Error(
      "WhatsApp Cloud API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env"
    );
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "text",
    text: { body: message, preview_url: false },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

module.exports = {
  isConfigured,
  normalizePhone,
  fillTemplate,
  buildManualLink,
  sendTemplateMessage,
  sendFreeTextViaCloudApi,
};
