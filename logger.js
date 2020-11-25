const bunyan = require('bunyan');

const packageInfo = require('./package');

const logger = bunyan.createLogger({
    name: packageInfo.name,
    level: process.env.LOG_LEVEL || 'info',
    serializers: bunyan.stdSerializers
});

module.exports = logger;
