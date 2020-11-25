const _ = require('lodash');
const mqtt = require('mqtt');

const MiScale = require('./scale');
const logger = require('./logger');

const client  = mqtt.connect('mqtt://localhost')

const miscale = new MiScale();

miscale.startScanning();

miscale.on('data', (scaleFull)  => {
    const scale = _.omit(scaleFull, ['svcData', 'manufacturerData']);
    logger.info({ scale }, 'Got scale data');

    if (!scale.isStabilized) {
        return;
    }

    logger.info({ scale }, 'Writing stable data');
    client.publish('mi.scale2', JSON.stringify(scale));
    logger.info('Data sent');
});

client.on('connect', function () {
    logger.info('MQTT connected')
})