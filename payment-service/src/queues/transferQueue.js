const { Queue } = require('bullmq');
const { connection } = require('../db/redis');

const transferQueue = new Queue('transferQueue', { connection });

const addTransferJob = async (jobData) => {
  await transferQueue.add('execute-transfer', jobData, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
};

module.exports = { transferQueue, addTransferJob };
