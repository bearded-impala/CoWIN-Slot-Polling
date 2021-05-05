export function checkIfEmpty(response) {
  if (response === null || undefined) {
    return true;
  }
  if (response.length === 0) {
    return true;
  }
  return false;
}

export function formatDate(date) {
  var d = new Date(date),
    day = d.getDate(),
    month = d.getMonth()+1,
    year = d.getFullYear();
  return [day, month, year].join('-');
}