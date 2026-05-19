export async function sendEmail(type: string, payload: {
  to?: string | null;
  name?: string | null;
  data?: Record<string, any>;
}) {
  if (!payload.to) return;

  try {
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        to: payload.to,
        name: payload.name,
        data: payload.data || {},
      }),
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
}

export async function sendOtp(to: string, name?: string) {
  const response = await fetch('/api/email/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, name }),
  });

  if (!response.ok) {
    throw new Error('Could not send OTP email.');
  }

  return response.json();
}
