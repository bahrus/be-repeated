import { BeHive, MountObserver, seed } from 'be-hive/be-hive.js';
export const emc = {
    base: 'be-repeated',
    branches: ['', 'start-idx', 'end-idx', 'templ-idx', 'buffer-size'],
    map: {
        '0.0': {
            instanceOf: 'Object',
            mapsTo: '.'
        },
        '1.0': {
            instanceOf: 'Number',
            mapsTo: 'startIdx'
        },
        '2.0': {
            instanceOf: 'Number',
            mapsTo: 'endIdx',
        },
        '3.0': {
            instanceOf: 'Number',
            mapsTo: 'templIdx',
        },
        '4.0': {
            instanceOf: 'Number',
            mapsTo: 'bufferSize'
        }
    },
    enhPropKey: 'beRepeated',
    importEnh: async () => {
        const { BeRepeated } = await import('./be-repeated.js');
        return BeRepeated;
    }
};
const mose = seed(emc);
MountObserver.synthesize(document, BeHive, mose);
