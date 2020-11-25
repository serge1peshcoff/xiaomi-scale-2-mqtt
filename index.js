const _ = require('lodash');
const mqtt = require('mqtt');

const MiScale = require('./scale');
const logger = require('./logger');
const config = require('./config');

const client  = mqtt.connect(config.mqtt.url)

const miscale = new MiScale();

miscale.startScanning();

miscale.on('data', (scaleFull)  => {
    const scale = _.omit(scaleFull, ['svcData', 'manufacturerData']);
    logger.info({ scale }, 'Got scale data');

    if (!scale.isStabilized) {
        return;
    }

    logger.info({ scale }, 'Writing stable data');
    client.publish(config.mqtt.topic, JSON.stringify(scale));
    logger.info('Data sent');
});

client.on('connect', function () {
    logger.info('MQTT connected')
})