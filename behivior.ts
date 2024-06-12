import {BeHive, EMC, MountObserver, seed} from 'be-hive/be-hive.js';

export const emc: EMC = {
    base: 'be-repeated',
    map: {
        '0.0': {
            instanceOf: 'Object',
            mapsTo: '.'
        }
    },
    enhPropKey: 'beRepeated',
    importEnh: async () => {
        const {BeRepeated} = await import('./be-repeated.js');
        return BeRepeated;
    }
};

const mose = seed(emc);

MountObserver.synthesize(document, BeHive, mose);