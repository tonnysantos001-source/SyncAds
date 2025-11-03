// Testar geração de Basic Auth
const publicKey = "pk_test_123";
const secretKey = "sk_test_456";

// Node.js/Browser
const authString = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
console.log("Basic Auth:", `Basic ${authString}`);

// Decode para verificar
const decoded = Buffer.from(authString, 'base64').toString('utf-8');
console.log("Decoded:", decoded);
