const Patches = require('Patches');
const Scene = require('Scene');
const Materials = require('Materials');
const Reactive = require('Reactive');

const bt = 0.05;
const timecodes = {
    LEFT: {
        isCollected: false,
        index: 0,
        times: [2.24, 11.31, 15.12],
        sceneObject: null,
        materials: {
            original: null,
            hit: null,
        },
    },
    UP: {
        isCollected: false,
        index: 0,
        times: [4.34, 12.95],
        sceneObject: null,
        materials: {
            original: null,
            hit: null,
        },
    },
    RIGHT: {
        isCollected: false,
        index: 0,
        times: [6.75, 17.65],
        sceneObject: null,
        materials: {
            original: null,
            hit: null,
        },
    },
};

var score = 0;

const startItem = (direction, et) => {
    const item = timecodes[direction];
    item.isCollected = false;
    item.sceneObject.material = item.materials.original;
    Patches.inputs.setScalar('duration_' + direction, (item.times[item.index] - et) * 2);
    Patches.inputs.setPulse('beatStart_' + direction, Reactive.once());
};

const getTriggerCallback = (direction, etPatch) => {
    return () => {
        const et = etPatch.pinLastValue();
        const item = timecodes[direction];

        if (!item.isCollected && Math.abs(item.times[item.index] - et) <= bt) {
            timecodes[direction].isCollection = true;
            timecodes[direction].sceneObject.material = item.materials.hit;
            ++score;
            Patches.inputs.setString('score', score.toString());
        }
    }
};

const getCompletionCallback = (direction, etPatch) => {
    return () => {
        ++timecodes[direction].index;
        startItem(direction, etPatch.pinLastValue());
    };
};

(async () => {
    const basebeatBlueMat = await Materials.findFirst('basebeat_blue_mat');
    const basebeatRedMat = await Materials.findFirst('basebeat_red_mat');
    const onHitBlueMat = await Materials.findFirst('onHit_blue_mat');
    const onHitRedMat = await Materials.findFirst('onHit_red_mat');

    timecodes.LEFT.materials.original = basebeatBlueMat;
    timecodes.LEFT.materials.hit = onHitBlueMat;

    timecodes.UP.materials.original = basebeatRedMat;
    timecodes.UP.materials.hit = onHitRedMat;

    timecodes.RIGHT.materials.original = basebeatBlueMat;
    timecodes.RIGHT.materials.hit = onHitBlueMat;

    const root = Scene.root;
    timecodes.LEFT.sceneObject = await root.findFirst('basebeatLeft');
    timecodes.UP.sceneObject = await root.findFirst('basebeatMiddle');
    timecodes.RIGHT.sceneObject = await root.findFirst('basebeatRight');

    const etPatch = await Patches.outputs.getScalar('et');

    Patches.outputs.getPulse('onStart').then(patch => {
        patch.subscribe(() => {
            score = 0;
            Patches.inputs.setString('score', score.toString());
            
            startItem('LEFT', 0);
            startItem('UP', 0);
            startItem('RIGHT', 0);
        });
    });

    // triggers

    const leftTrigger = await Patches.outputs.getPulse('onLeft');
    leftTrigger.subscribe(getTriggerCallback('LEFT', etPatch));

    const rightTrigger = await Patches.outputs.getPulse('onRight');
    rightTrigger.subscribe(getTriggerCallback('RIGHT', etPatch));

    const upTrigger = await Patches.outputs.getPulse('onUp');
    upTrigger.subscribe(getTriggerCallback('UP', etPatch));

    // completion

    const leftCompletion = await Patches.outputs.getPulse('leftCompletion');
    leftCompletion.subscribe(getCompletionCallback('LEFT', etPatch));

    const upCompletion = await Patches.outputs.getPulse('upCompletion');
    upCompletion.subscribe(getCompletionCallback('UP', etPatch));

    const rightCompletion = await Patches.outputs.getPulse('rightCompletion');
    rightCompletion.subscribe(getCompletionCallback('RIGHT', etPatch));
})();
