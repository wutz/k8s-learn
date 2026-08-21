/**
 * 匿名身份：HMAC 签名 cookie（k8l_uid=<uuid>.<sig>）。
 * 仅在 server function / 服务端上下文中调用。
 */
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

const COOKIE_NAME = "k8l_uid";
const MAX_AGE = 60 * 60 * 24 * 365;

async function sign(uuid: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(uuid));
  let bin = "";
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * 取当前用户 id；无有效 cookie 时铸造新身份并 set-cookie。
 * 同时确保 users 表存在该用户。
 */
export async function getUserId(): Promise<string> {
  const secret: string | undefined = env.PROGRESS_COOKIE_SECRET;
  const existing = getCookie(COOKIE_NAME);

  if (existing && secret) {
    const dot = existing.lastIndexOf(".");
    if (dot > 0) {
      const uuid = existing.slice(0, dot);
      const sig = existing.slice(dot + 1);
      if (uuid && sig && (await sign(uuid, secret)) === sig) {
        return uuid;
      }
    }
  }

  const uuid = crypto.randomUUID();
  if (secret) {
    setCookie(COOKIE_NAME, `${uuid}.${await sign(uuid, secret)}`, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
  } else {
    console.warn("PROGRESS_COOKIE_SECRET 未配置，进度将不持久");
  }
  return uuid;
}
