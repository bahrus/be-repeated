import { BeHive, MountObserver, seed } from 'be-hive/be-hive.js';
export const emc = {
    base: 'be-repeated',
    map: {
        '0.0': {
            instanceOf: 'Object',
            mapsTo: '.'
        }
    },
    enhPropKey: 'beRepeated',
    importEnh: async () => {
        const { BeRepeated } = await import('./behance.js');
        return BeRepeated;
    }
};
const mose = seed(emc);
MountObserver.synthesize(document, BeHive, mose);
