const Patches = require('Patches');
const Diagnostics = require('Diagnostics');

const timecodes = [
    {
        t: 2.24,
        direction: 'LEFT',
    },
    {
        t: 4.34,
        direction: 'UP',
    },
    {
        t: 6.75,
        direction: 'RIGHT',
    },
    {
        t: 11.31,
        direction: 'LEFT',
    },
    {
        t: 12.95,
        direction: 'UP',
    },
    {
        t: 15.12,
        direction: 'LEFT',
    },
    {
        t: 17.65,
        direction: 'RIGHT',
    },
];

var index = 0;
const bt = 0.5;

const getTriggerCallback = (direction, etPatch) => {
    return () => {
        const item = timecodes[index];
        const et = etPatch.pinLastValue();

        if (item.direction == direction && Math.abs(item.t - et) <= bt) {
            Diagnostics.log("triggered");
            ++index;
        }
    }
};

(async () => {
    const etPatch = await Patches.outputs.getScalar('et');

    etPatch.monitor().subscribe(event => {
        const et = event.newValue;
        if (et - timecodes[index].t > bt) {
            ++index;
        }
    });

    const leftTrigger = await Patches.outputs.getPulse('onLeft');
    leftTrigger.subscribe(getTriggerCallback('LEFT', etPatch));

    const rightTrigger = await Patches.outputs.getPulse('onRight');
    rightTrigger.subscribe(getTriggerCallback('RIGHT', etPatch));

    const upTrigger = await Patches.outputs.getPulse('onUp');
    upTrigger.subscribe(getTriggerCallback('UP', etPatch));
})();
