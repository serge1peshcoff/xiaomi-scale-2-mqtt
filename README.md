# xiaomi-scale-2-mqtt

Reads [Mi Body Composition Scale 2](https://ru.buy.mi.com/ru/item/3194100001) from a Bluetooth device and sends it to MQTT.

## Credits
- https://dev.to/henrylim96/reading-xiaomi-mi-scale-data-with-web-bluetooth-scanning-api-1mb9 - reverse-engineering Mi Scale 2 protocol
- https://github.com/oliexdev/openScale/wiki/Xiaomi-Bluetooth-Mi-Scale - reverse-engineering Mi Scale 1 protocol
- https://github.com/perillamint/node-xiaomi-scale - library for Mi Scale 1 used as a base for this integration

## How does it work?
- It queries for all Mi Scale 2 devices via Bluetooth
- When a scale broadcasts its data, the script would catch and parse it
- If the data is stable, then it's sent to MQTT broker
- Then you can use it in other tools (I needed it in Home Assistant, that's why I wrote this)

## How to run it?
1. Build the container:

```
docker build -t xiaomi-scale-2-mqtt .
```

2. Run the container (for configuration, see below):

```
docker run -it --net=host \
    -d --name=xiaomi-scale-2-mqtt \
    -e DATE_OF_BIRTH=<put your DoB here> \
    -e SEX=<your sex here> \
    -e HEIGHT=<your height here> \
    -e TZ=<your timezone here> \
    xiaomi-scale-2-mqtt
```

3. Install MQTT client to test it: `npm install -g mqtt`
4. Run it to listed for the MQTT messages: `mqtt sub -t 'mi.scale2' -v`
5. Step on your scale, wait for it to stabilize, then MQTT client should receive a bunch of JSON.

# Integrating it into Home Assistant
1. Set up the MQTT integration for Home Assistant
2. Add this to `sensors.yaml`:

```
- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Weight'
  value_template: "{{ value_json.weight }}"
  unit_of_measurement: "kg"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Last update'
  value_template: "{{ as_timestamp(value_json.date) | timestamp_custom('%d %b %Y %H:%M') }}"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - BMI'
  value_template: "{{ value_json.bmi|round(2) }}"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Ideal weight'
  value_template: "{{ value_json.idealWeight|round(2) }}"
  unit_of_measurement: "kg"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Metabolic age'
  value_template: "{{ value_json.metabolicAge|round(2) }}"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Protein percentage'
  value_template: "{{ value_json.proteinPercentage|round(2) }}"
  unit_of_measurement: "%"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - LBM'
  value_template: "{{ value_json.lbm|round(2) }}"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - BMR'
  value_template: "{{ value_json.bmr|round(2) }}"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Fat percentage'
  value_template: "{{ value_json.fatPercentage|round(2) }}"
  unit_of_measurement: "%"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Muscle mass'
  value_template: "{{ value_json.muscleMass|round(2) }}"
  unit_of_measurement: "kg"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Bone mass'
  value_template: "{{ value_json.boneMass|round(2) }}"
  unit_of_measurement: "kg"

- platform: mqtt
  state_topic: 'mi.scale2'
  name: 'Mi Scale 2 - Visceral fat'
  value_template: "{{ value_json.visceralFat|round(2) }}"
```

3. Restart Home Assistant
4. Create a Lovelace UI card which uses these newly created sensors:

```
type: entities
entities:
  - entity: sensor.mi_scale_2_weight
  - entity: sensor.mi_scale_2_ideal_weight
  - entity: sensor.mi_scale_2_last_update
  - entity: sensor.mi_scale_2_bmi
  - entity: sensor.mi_scale_2_metabolic_age
  - entity: sensor.mi_scale_2_protein_percentage
  - entity: sensor.mi_scale_2_fat_percentage
  - entity: sensor.mi_scale_2_bmr
  - entity: sensor.mi_scale_2_muscle_mass
  - entity: sensor.mi_scale_2_bone_mass
  - entity: sensor.mi_scale_2_visceral_fat
state_color: false
title: Scale
```

5. See this as a Home Assistant card.

## Configration

All the configuration is done through the environmental variables.
- `LOG_LEVEL` - integration logging level. Default: `info`. If something isn't working, try setting it to `debug` or even `trace` and check what's inside.
- `MQTT_URL` - MQTT broker url. Default: `mqtt://localhost`.
- `MQTT_TOPIC` - MQTT topic. Default: `mi.scale2`.
- `DEBOUNCE` - within that interval, only 1 measurement per scale would be sent. Default: `30`.
- `DATE_OF_BIRTH` - date of birth of a person who's using the scale, in this format: `YYYY-MM-DD`. Used for calculating the person's age.
- `SEX` - sex of a person who's using the scale, either `male` or `female`.
- `HEIGHT` - height of a person who's using the scale.

If any of the last 3 parameters is not set, the script won't be able to calculate a bunch of parameters (like BMI, ldeal weight etc.).
