export function testToken(subject = 'alice', expiresAt = Math.floor(Date.now() / 1000) + 1800) {
  return `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(JSON.stringify({ sub: subject, exp: expiresAt }))}.signature`;
}
