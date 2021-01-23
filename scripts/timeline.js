const Patches = require('Patches');
const Time = require('Time');
const Reactive = require('Reactive');

const timeline = [
    { // burst animation appear
        t: 0,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    { // burst animation disappear
        t: 3,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    { // flower appear
        t: 3,
        action: Patches.inputs.setBoolean,
        key: 'flowerVisible',
        value: () => true,
    },
    { // flower disappear
        t: 6,
        action: Patches.inputs.setBoolean,
        key: 'flowerVisible',
        value: () => false,
    },
    { // eyes appear
        t: 6,
        action: Patches.inputs.setBoolean,
        key: 'eyesVisible',
        value: () => true,
    },
    { 
        t: 6,
        action: Patches.inputs.setPulse,
        key: 'eyesTrigger',
        value: () => Reactive.once(),
    },
    {
        t: 9,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    {
        t: 9,
        action: Patches.inputs.setBoolean,
        key: 'sunburstVisible',
        value: () => true,
    },
    {
        t: 10,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    {
        t: 10,
        action: Patches.inputs.setBoolean,
        key: 'eyesVisible',
        value: () => false,
    },
    {
        t: 11,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    {
        t: 11,
        action: Patches.inputs.setBoolean,
        key: 'necklaceVisible',
        value: () => true,
    },
    {
        t: 12,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    {
        t: 13,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    {
        t: 13,
        action: Patches.inputs.setBoolean,
        key: 'bottomBorderVisible',
        value: () => true,
    },
    {
        t: 14,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    {
        t: 15,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    {
        t: 15,
        action: Patches.inputs.setBoolean,
        key: 'sunburstVisible',
        value: () => false,
    },
    {
        t: 15,
        action: Patches.inputs.setBoolean,
        key: 'necklaceVisible',
        value: () => false,
    },
    {
        t: 16,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    {
        t: 18,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    {
        t: 19,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    {
        t: 19,
        action: Patches.inputs.setBoolean,
        key: 'bottomBorderVisible',
        value: () => false,
    },
];

var countdown = 3;
var index = 0;
var hasGameStarted = false;

const updateCounter = i => {
    Patches.inputs.setString('counterText', i.toString());
    Patches.inputs.setPulse('counterPulse', Reactive.once());
};

const startGame = () => {
    Patches.inputs.setPulse('onGameStart', Reactive.once());
    hasGameStarted = true;
};

Patches.outputs.getPulse('onStart').then(patch => {
    patch.subscribe(() => {
        Patches.inputs.setBoolean('counterVisible', true);
        countdown = 3;
        updateCounter(countdown);
        Time.setInterval(() => {
            --countdown;
            if (countdown == 0) {
                Patches.inputs.setBoolean('counterVisible', false);
                startGame();
                Time.clearInterval(this);
            } else {
                updateCounter(countdown);
            }
        }, 1000); 
        index = 0;
    });
});

Patches.outputs.getScalar('et').then(patch => {
    patch.monitor().subscribe(event => {
        if (!hasGameStarted) return;

        const et = event.newValue;
        while (et > timeline[index].t) {
            const item = timeline[index];
            item.action(item.key, item.value());
            ++index;
        }
    });
});