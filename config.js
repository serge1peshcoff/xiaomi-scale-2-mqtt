module.exports = {
    mqtt: {
        url: process.env.MQTT_URL || 'mqtt://localhost',
        topic: process.env.MQTT_TOPIC || 'mi.scale2'
    },
    log: {
        level: process.env.LOG_LEVEL || 'info'
    }
}