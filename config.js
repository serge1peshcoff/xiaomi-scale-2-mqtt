module.exports = {
    mqtt: {
        url: process.env.MQTT_URL || 'mqtt://localhost',
        topic: process.env.MQTT_TOPIC || 'mi.scale2'
    },
    log: {
        level: process.env.LOG_LEVEL || 'info'
    },
    scale: {
        debounce: process.env.DEBOUNCE || 30
    },
    user: {
        dateOfBirth: process.env.DATE_OF_BIRTH,
        height: parseFloat(process.env.HEIGHT),
        sex: process.env.SEX
    }
}