export async function isApiReachable(
  url: string,
  timeoutMs = 5000,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    console.log(res);
    return res.ok; // true for 2xx status codes
  } catch {
    return false; // network error, timeout, or CORS block
  } finally {
    clearTimeout(timeout);
  }
}
