export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countMatches(text: string, aliases: string[]) {
  return aliases.reduce((total, alias) => {
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(alias)}(?=[^a-z0-9+#]|$)`, "gi");
    return total + [...text.matchAll(pattern)].length;
  }, 0);
}

export function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
