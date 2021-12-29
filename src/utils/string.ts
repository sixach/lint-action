/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to process
 * @returns {string} - Input string with first letter capitalized
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Removes the trailing period from the provided string (if it has one)
 * @param {string} str - String to process
 * @returns {string} - String without trailing period
 */
function removeTrailingPeriod(str: string): string {
  return str.endsWith('.') ? str.substring(0, str.length - 1) : str
}

export {capitalizeFirstLetter, removeTrailingPeriod}
