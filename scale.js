const EventEmitter = require('events');
const noble = require('@abandonware/noble');

const logger = require('./logger');
const config = require('./config');

class MiScale extends EventEmitter {
    constructor() {
        logger.debug('Creating MiScale instance')
        super();
        let self = this;

        this.lastMeasurement = {};

        noble.on('discover', function (foo) {
            self._nobleDiscoverListener(foo);
        });
    };

    _scaleListener(peripheral) {
        if (peripheral.advertisement.serviceData.length === 0) {
            logger.trace('No peripheral data, skipping.');
            return;
        }

        logger.trace(peripheral, 'Got data')

        const scale = {
            address: peripheral.address,
            svcUUID: peripheral.advertisement.serviceData[0].uuid,
            svcData: peripheral.advertisement.serviceData[0].data,
            manufacturerData: peripheral.advertisement.manufacturerData
        };

        // Parse service data.
        let svcData = scale.svcData;

        // byte 1:
        // bit 5 - stable
        // bit 7 - loadRemoved
        // bytes 2-3 - year (little endian)
        // byte 4 - month
        // byte 5 - day
        // byte 6 - hour
        // byte 7 - minute
        // byte 8 - second
        // byte 11-12 - weight (little endian) / 200
        scale.date = new Date(
            svcData[3] * 256 + svcData[2], // year
            svcData[4], // month
            svcData[5], // day
            svcData[6], // hour
            svcData[7], // minutes
            svcData[8] // seconds
        );

        scale.isStabilized = ((svcData[1] & (1<<5)) !== 0) ? true : false;
        scale.loadRemoved = ((svcData[1] & (1<<7)) !== 0) ? true : false;

        if ((svcData[0] & (1<<4)) !== 0) { // Chinese Catty
            scale.unit = "jin";
        } else if ((svcData[0] & 0x0F) === 0x03) { // Imperial pound
            scale.unit = "lbs";
        } else if ((svcData[0] & 0x0F) === 0x02) { // MKS kg
            scale.unit = "kg";
        } else {
            throw new Error("Invalid data!");
        }

        scale.weight = (svcData[12] * 256 + svcData[11]) / 100;
        if (scale.unit === "kg") { //Convert chinese Catty to kg.
            scale.weight /= 2;
        }

        scale.impedance = (svcData[10] * 256 + svcData[9]);

        if (!scale.isStabilized || scale.loadRemoved || scale.impedance === 0 || scale.impedance >= 3000) {
            logger.trace({
                isStabilized: scale.isStabilized,
                loadRemoved: scale.loadRemoved,
                impedance: scale.impedance
            }, 'Unstable data, skipping');
            return;
        }

        // Checking the last time we got the message from this MAC address
        if (this.lastMeasurement[peripheral.address]) {
            const now = Date.now();
            const then = this.lastMeasurement[peripheral.address];
            const diff = now - then;
            if (diff <= 1000 * config.scale.debounce) {
                logger.debug({
                    address: peripheral.address,
                    now,
                    then,
                    diff
                }, 'Not enough time passed, skipping.');
                return;
            }
        }

        this.lastMeasurement[peripheral.address] = Date.now(); // in ms

        this.emit('data', scale);
    };

    _nobleDiscoverListener(peripheral) {
        if (peripheral.advertisement.localName === "MIBCS") {
            this._scaleListener(peripheral);
        }
    };

    startScanning() {
        noble.on('stateChange', function(state) {
            logger.debug({ state}, 'Mi Scale state change')
            if (state === 'poweredOn') {
                noble.startScanning([], true);
            }
        });
    };

    stopScanning() {
        noble.stopScanning();
    };
};

module.exports = MiScale;
