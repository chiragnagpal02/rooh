export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  const apiKey = process.env.WHATSAPP_API_KEY
  const phoneId = process.env.WHATSAPP_PHONE_ID

  // Skip if WhatsApp not configured yet
  if (!apiKey || !phoneId) {
    console.log(`[WhatsApp not configured] Would send to ${to}: ${message}`)
    return false
  }

  try {
    const response = await fetch(
      `https://waba.360dialog.io/v1/messages`,
      {
        method: 'POST',
        headers: {
          'D360-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    )
    return response.ok
  } catch (err) {
    console.error('WhatsApp send error:', err)
    return false
  }
}