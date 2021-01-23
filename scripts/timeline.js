const Patches = require('Patches');
const Time = require('Time');
const Reactive = require('Reactive');

const timeline = [
    { // burst animation appear
        t: 4.5,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    { // burst animation disappear
        t: 6,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },
    {
        t: 7.58,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => true,
    },
    {
        t: 8.15,
        action: Patches.inputs.setBoolean,
        key: 'burstVisible',
        value: () => false,
    },

    { // eyes appear
        t: 9.75,
        action: Patches.inputs.setBoolean,
        key: 'eyesVisible',
        value: () => true,
    },
    { 
        t: 9.75,
        action: Patches.inputs.setPulse,
        key: 'eyesTrigger',
        value: () => Reactive.once(),
    },
    {
        t: 11.00,
        action: Patches.inputs.setBoolean,
        key: 'eyesVisible',
        value: () => false,
    },

    { // flower appear
        t: 11.32,
        action: Patches.inputs.setBoolean,
        key: 'flowerVisible',
        value: () => true,
    },
    { // flower disappear
        t: 13.00,
        action: Patches.inputs.setBoolean,
        key: 'flowerVisible',
        value: () => false,
    },

    {
        t: 14.00,
        action: Patches.inputs.setBoolean,
        key: 'sunburstVisible',
        value: () => true,
    },
    {
        t: 14.05,
        action: Patches.inputs.setBoolean,
        key: 'necklaceVisible',
        value: () => true,
    },

    {
        t: 15.00,
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
        t: 15.05,
        action: Patches.inputs.setBoolean,
        key: 'bottomBorderVisible',
        value: () => true,
    },
    {
        t: 16.50,
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
    Patches.inputs.setBoolean('isPlaying', hasGameStarted);
};

Patches.outputs.getPulse('onStart').then(patch => {
    patch.subscribe(() => {
        Patches.inputs.setBoolean('counterVisible', true);
        countdown = 3;
        hasGameStarted = false;
        Patches.inputs.setBoolean('isPlaying', hasGameStarted);
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
        while (index < timeline.length && et > timeline[index].t) {
            const item = timeline[index];
            item.action(item.key, item.value());
            ++index;
        }
    });
});