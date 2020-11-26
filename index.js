const _ = require('lodash');
const mqtt = require('mqtt');

const MiScale = require('./scale');
const logger = require('./logger');
const config = require('./config');
const Measurement = require('./measurement');

const client  = mqtt.connect(config.mqtt.url)

const miscale = new MiScale();

miscale.startScanning();

miscale.on('data', (scaleFull)  => {
    const scale = _.omit(scaleFull, ['svcData', 'manufacturerData']);
    logger.debug({ scale }, 'Got scale data');

    const measurement = Measurement.createWithParams(scaleFull, config.user);
    const result = measurement.result();

    logger.info({ result }, 'Writing stable data');
    client.publish(config.mqtt.topic, JSON.stringify(result));
    logger.info('Data sent');
});

client.on('connect', function () {
    logger.info('MQTT connected')
})