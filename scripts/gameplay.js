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
                isCollected: false,
                index: 0,
                times: [4.4, 9.17, 16.59],
                sceneObject: null,
            },
            {
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
                isCollected: false,
                index: 0,
                times: [2.2, 8.64, 13.45, 16.40],
                sceneObject: null,
            },
            {
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

const subscribeCompletion = (direction, index, etPatch) => {
    Patches.outputs.getPulse('completion_' + direction + '_' + index).then(
        patch => patch.subscribe(getCompletionCallback(direction, index, etPatch))
    );
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
            timecodes.LEFT.index = 0;
            timecodes.UP.index = 0;
            timecodes.RIGHT.index = 0;
            score = 0;
            Patches.inputs.setString('score', score.toString());
            
            startItem('LEFT', 0, 0);
            startItem('LEFT', 1, 0);
            startItem('UP', 0, 0);
            startItem('RIGHT', 0, 0);
            startItem('RIGHT', 1, 0);
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
