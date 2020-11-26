const EventEmitter = require('events');
const noble = require('@abandonware/noble');

const logger = require('./logger');

class MiScale extends EventEmitter {
    constructor(macAddr) {
        logger.debug({ macAddr }, 'Creating MiScale instance')
        super();
        let self = this;

        this._macAddr = macAddr;
        this._scales = new Array();

        noble.on('discover', function (foo) {
            self._nobleDiscoverListener(foo);
        });
    };

    _scaleListener(peripheral) {
        logger.trace(peripheral, 'Got data')

        let scale = new Object();

        scale.address = peripheral.address;

        if (peripheral.advertisement.serviceData.length === 0) {
          return;
        }

        // Assume only single service is available on scale.
        scale.svcUUID = peripheral.advertisement.serviceData[0].uuid;
        scale.svcData = peripheral.advertisement.serviceData[0].data;
        scale.manufacturerData = peripheral.advertisement.manufacturerData;

        // Is it duplicated packet?
        if(this._scales[scale.address] &&
           this._scales[scale.address].svcData.compare(scale.svcData) == 0) {
            return;
        }

        //Save scale object in duplication lookup table.
        this._scales[scale.address] = scale;

        //Parse service data.
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
