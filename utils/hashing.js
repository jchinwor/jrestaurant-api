
const { createHmac } = require('crypto');

exports.hmacProcess = (value, key) => {
  const result = createHmac('sha256', key)
    .update(String(value)) // ensures compatibility
    .digest('hex');
  return result;
};