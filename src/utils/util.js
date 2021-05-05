export function checkIfEmpty(response) {
  if (response === null || undefined) {
    return true;
  }
  if (response.length === 0) {
    return true;
  }
  return false;
}