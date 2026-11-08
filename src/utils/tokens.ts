export function estimateTokens(text: string): number {
  // Very rough approximation: ~4 characters per token
  return Math.max(0, Math.ceil(text.length / 4));
}
