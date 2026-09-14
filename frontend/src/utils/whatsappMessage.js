/** Replaces {memberName}, {expiryDate}, {gymName} in a template string — mirrors backend/services/whatsappService.js */
export function fillTemplate(template, { memberName, expiryDate, gymName }) {
  if (!template) return "";
  return template
    .replaceAll("{memberName}", memberName ?? "{memberName}")
    .replaceAll("{expiryDate}", expiryDate ?? "{expiryDate}")
    .replaceAll("{gymName}", gymName ?? "{gymName}");
}
