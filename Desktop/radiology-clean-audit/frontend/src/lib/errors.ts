/**
 * Hata mesajını güvenli şekilde çıkarır.
 * catch (e: unknown) ile kullanılmak üzere tasarlanmıştır.
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return String(e);
}
