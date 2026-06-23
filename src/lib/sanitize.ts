/**
 * Neutralizes string parameters to prevent XSS payloads and script injection.
 * Strips script tags, style blocks, and event handlers.
 * 
 * @param str The raw string to sanitize.
 * @returns The sanitized plain string.
 */
export function sanitizeInputString(str: string): string {
  if (!str || typeof str !== "string") return str;

  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // Remove <script>...</script>
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")   // Remove <style>...</style>
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")              // Remove event handler tags like onload, onclick
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/on\w+\s*=\s*\w+/gi, "")
    .replace(/javascript:\s*[\s\S]*/gi, "")             // Strip javascript: URLs
    .replace(/<\/?[^>]+(>|$)/g, "")                     // Strip HTML tag boundaries entirely
    .trim();
}

/**
 * Recursively sanitizes all string properties of an object or array.
 * 
 * @param obj The object or array containing inputs.
 * @returns The deep-sanitized input container.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeInputString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      result[key] = sanitizeObject((obj as any)[key]);
    }
    return result as T;
  }

  return obj;
}
