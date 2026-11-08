export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}
