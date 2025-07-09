import * as crypto from 'crypto-js';

export function signData(data: any, secretKey: string): string {
  const jsonData = JSON.stringify(data);
  return crypto.HmacSHA256(jsonData, secretKey).toString();
}