import { randomBytes } from 'node:crypto';

/**
 * CSP の nonce は推測不可能である必要があります（Math.random() は暗号的に予測可能なため、
 * 万一 nonce を推測されると script-src の許可を悪用されうる）。ここでは crypto の
 * 乱数を使い、16 バイト（128bit）を base64url 相当の英数字に変換して返します。
 */
export function getNonce(): string {
  return randomBytes(24).toString('base64').replace(/[+/=]/g, '').slice(0, 32);
}
