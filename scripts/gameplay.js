const Patches = require('Patches');
const Scene = require('Scene');
const Materials = require('Materials');
const Reactive = require('Reactive');
const Diagnostics = require('Diagnostics');

const bt = 0.5;
const timecodes = {
    LEFT: {
        materials: {
            original: null,
            hit: null,
        },
        beats: [
            {
                delay: 0,
                isStarted: false,
                isCollected: false,
                index: 0,
                times: [4.4, 9.17, 16.59],
                sceneObject: null,
            },
            {
                delay: 4,
                isStarted: false,
                isCollected: false,
                index: 0,
                times: [7.02, 13.99, 16.87],
                sceneObject: null,
            }
        ]
    },

    UP: {
        materials: {
            original: null,
            hit: null,
        },
        beats: [
            {
                delay: 4,
                isStarted: false,
                isCollected: false,
                index: 0,
                times: [7.56, 11.31, 17.74],
                sceneObject: null,
            }
        ]
    },

    RIGHT: {
        materials: {
            original: null,
            hit: null,
        },
        beats: [
            {
                delay: 0,
                isStarted: false,
                isCollected: false,
                index: 0,
                times: [2.2, 8.64, 13.45, 16.40],
                sceneObject: null,
            },
            {
                delay: 3,
                isStarted: false,
                isCollected: false,
                index: 0,
                times: [6.5, 9.70, 16.13],
                sceneObject: null,
            },
        ],
    },
};

var score = 0;

const startItem = (direction, index, et) => {
    const type = timecodes[direction];
    const item = type.beats[index];
    item.isCollected = false;
    item.sceneObject.material = type.materials.original;
    Diagnostics.log(item.index);
    Diagnostics.log('duration_' + direction + '_' + index + ' = ' + (item.times[item.index] - et));
    Diagnostics.log('beatStart_' + direction + '_' + index);
    Patches.inputs.setScalar('duration_' + direction + '_' + index, (item.times[item.index] - et));
    Patches.inputs.setPulse('beatStart_' + direction + '_' + index, Reactive.once());
};

const getTriggerCallback = (direction, etPatch) => {
    return () => {
        const et = etPatch.pinLastValue();
        const type = timecodes[direction];
        const beats = type.beats;

        beats.forEach((item, index) => {
            if (!item.isCollected && Math.abs(item.times[item.index] - et) <= bt) {
                timecodes[direction].beats[index].isCollected = true;
                timecodes[direction].beats[index].sceneObject.material = type.materials.hit;
                ++score;
                Patches.inputs.setString('score', score.toString());
            }
        });
    }
};

const getCompletionCallback = (direction, index, etPatch) => {
    if (direction == 'UP') {
        return () => {
            Diagnostics.log(direction + ' (' + index + ') completed');
            ++timecodes[direction].beats[index].index;
            if (timecodes[direction].beats[index].index >= timecodes[direction].beats[index].times.length) {
                Diagnostics.log('completed');
                Patches.inputs.setPulse('onGameplayEnd', Reactive.once());
                Patches.inputs.setBoolean('isPlaying', false);
            } else {
                startItem(direction, index, etPatch.pinLastValue());
            }
        };
    } else {
        return () => {
            Diagnostics.log(direction + ' (' + index + ') completed');
            ++timecodes[direction].beats[index].index;
            startItem(direction, index, etPatch.pinLastValue());
        };
    }
};

const initialiseBeat = (direction, index) => {
    timecodes[direction].beats[index].isStarted = false;
    timecodes[direction].beats[index].index = 0;
}

const subscribeCompletion = (direction, index, etPatch) => {
    Patches.outputs.getPulse('completion_' + direction + '_' + index).then(
        patch => patch.subscribe(getCompletionCallback(direction, index, etPatch))
    );
};

const checkStart = (direction, et) => {
    const beats = timecodes[direction].beats;
    beats.forEach((item, index) => {
        if (!item.isStarted && et > item.delay) {
            timecodes[direction].beats[index].isStarted = true;
            startItem(direction, index, et);
        }
    });
};

(async () => {
    const basebeatBlueMat = await Materials.findFirst('basebeat_blue_mat');
    const basebeatRedMat = await Materials.findFirst('basebeat_red_mat');
    const onHitBlueMat = await Materials.findFirst('onHit_blue_mat');
    const onHitRedMat = await Materials.findFirst('onHit_red_mat');

    const root = Scene.root;
    // left
    timecodes.LEFT.materials.original = basebeatBlueMat;
    timecodes.LEFT.materials.hit = onHitBlueMat;
    timecodes.LEFT.beats[0].sceneObject = await root.findFirst('basebeatLeft0');
    timecodes.LEFT.beats[1].sceneObject = await root.findFirst('basebeatLeft1');
    // up
    timecodes.UP.materials.original = basebeatRedMat;
    timecodes.UP.materials.hit = onHitRedMat;
    timecodes.UP.beats[0].sceneObject = await root.findFirst('basebeatMiddle0');
    // right
    timecodes.RIGHT.materials.original = basebeatBlueMat;
    timecodes.RIGHT.materials.hit = onHitBlueMat;
    timecodes.RIGHT.beats[0].sceneObject = await root.findFirst('basebeatRight0');
    timecodes.RIGHT.beats[1].sceneObject = await root.findFirst('basebeatRight1');

    const etPatch = await Patches.outputs.getScalar('et');
    Patches.outputs.getPulse('startGame').then(patch => {
        patch.subscribe(() => {
            initialiseBeat('LEFT', 0);
            initialiseBeat('LEFT', 1);
            initialiseBeat('UP', 0);
            initialiseBeat('RIGHT', 0);
            initialiseBeat('RIGHT', 1);
            score = 0;
            Patches.inputs.setString('score', score.toString());
            // startItem('LEFT', 0, 0);
            // startItem('LEFT', 1, 0);
            // startItem('UP', 0, 0);
            // startItem('RIGHT', 0, 0);
            // startItem('RIGHT', 1, 0);
            etPatch.monitor().subscribe(event => {
                const et = event.newValue;
                checkStart('LEFT', et);
                checkStart('UP', et);
                checkStart('RIGHT', et);
            });
        });
    });

    // triggers
    Patches.outputs.getPulse('onLeft').then(
        patch => patch.subscribe(getTriggerCallback('LEFT', etPatch))
    );

    Patches.outputs.getPulse('onUp').then(
        patch => patch.subscribe(getTriggerCallback('UP', etPatch))
    );

    Patches.outputs.getPulse('onRight').then(
        patch => patch.subscribe(getTriggerCallback('RIGHT', etPatch))
    );

    // completion
    subscribeCompletion('LEFT', 0, etPatch);
    subscribeCompletion('LEFT', 1, etPatch);
    subscribeCompletion('UP', 0, etPatch);
    subscribeCompletion('RIGHT', 0, etPatch);
    subscribeCompletion('RIGHT', 1, etPatch);
})();
