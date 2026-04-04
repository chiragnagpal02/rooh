export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  const token = process.env.WHATSAPP_API_KEY
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    console.log(`[WhatsApp not configured] Would send to ${to}: ${message}`)
    return false
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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