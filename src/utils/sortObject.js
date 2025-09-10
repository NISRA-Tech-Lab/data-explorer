// Recursively sort object keys at all nesting levels
export function sortObject(obj) {
  if (Array.isArray(obj)) {
    // If it's an array, recurse into each item
    return obj.map(sortObject);
  } else if (obj !== null && typeof obj === "object") {
    // If it's an object, sort its keys
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b)) // alphabetical sort
      .reduce((acc, key) => {
        acc[key] = sortObject(obj[key]); // recurse into values
        return acc;
      }, {});
  }
  // If primitive (string, number, etc.), just return it
  return obj;
}