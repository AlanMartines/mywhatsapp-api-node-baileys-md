const fs = require('fs-extra');

async function isDocker() {
const isDocker = process.env.DOCKER_CONTAINER === 'true';
if (isDocker) {
  return true;
} else {
  return false;
}
}

exports.isDocker = isDocker();