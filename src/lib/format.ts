/**
 * Capitalizes the first letter of each word in a string, following Turkish rules.
 * @param str The string to format
 * @returns The formatted string
 */
export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map(word => 
      word.charAt(0).toLocaleUpperCase("tr-TR") + 
      word.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
};
