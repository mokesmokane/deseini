/**
 * Get the next color in a palette, given a base color (hex or name).
 */
export function getNextColor(baseColor?: string): string {
  const defaultColor = '#3b82f6'; // Primary blue
  if (!baseColor) return defaultColor;
  try {
    const colors = [
      '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899',
      '#06b6d4', '#6366f1', '#84cc16', '#14b8a6', '#a855f7', '#f97316'
    ];
    let index = colors.indexOf(baseColor);
    if (index === -1) {
      const colorNameMap: Record<string, string> = {
        blue: '#3b82f6', green: '#10b981', red: '#ef4444', yellow: '#f59e0b',
        violet: '#8b5cf6', pink: '#ec4899', cyan: '#06b6d4', indigo: '#6366f1',
        lime: '#84cc16', teal: '#14b8a6', purple: '#a855f7', orange: '#f97316'
      };
      const matchedHex = colorNameMap[baseColor.toLowerCase()];
      if (matchedHex) {
        index = colors.indexOf(matchedHex);
      }
    }
    if (index === -1) return colors[0];
    return colors[(index + 1) % colors.length];
  } catch {
    return defaultColor;
  }
}
