/**
 * Normalize a string for case-insensitive comparison
 * Trims whitespace and converts to lowercase
 */
export function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Parse a line in the format "Card Name [SET]" or "Count Card Name [SET]" and extract the card name and set
 * @param line The input line to parse
 * @returns Object with name and set, or null if parsing fails
 */
export function parseCardLine(line: string): { name: string; set: string } | null {
  // Remove comments and trim
  const cleanLine = line.split('#')[0]?.trim();
  
  if (!cleanLine) {
    return null;
  }
  
  // Match pattern: optional number followed by card name and [SET] at the end
  const match = cleanLine.match(/^(?:\d+\s+)?(.+?)\s*\[([^\]]+)\]$/);
  
  if (!match) {
    return null;
  }
  
  const name = match[1]?.trim();
  const set = match[2]?.trim();
  
  if (!name || !set) {
    return null;
  }
  
  return { name, set };
}

/**
 * Check if a line should be skipped (empty or comment)
 */
export function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('#');
}

/**
 * Validate file extension
 */
export function validateFileExtension(filePath: string, expectedExtension: string): boolean {
  return filePath.toLowerCase().endsWith(expectedExtension.toLowerCase());
}