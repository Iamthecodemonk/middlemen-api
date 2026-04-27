function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

module.exports = { addSeconds };
