const bunyan = require('bunyan');

const packageInfo = require('./package');
const config = require('./config');

const logger = bunyan.createLogger({
    name: packageInfo.name,
    level: config.log.level || 'info',
    serializers: bunyan.stdSerializers
});

module.exports = logger;
