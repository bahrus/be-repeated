import {BeHive, EnhancementMountCnfg} from 'be-hive/be-hive.js';
import {MountObserver, MOSE} from 'mount-observer/MountObserver.js';

const base = 'be-repeated';
const emc: EnhancementMountCnfg = {
    base,
    map: {
        '0.0': 'ni'
    },
    enhPropKey: 'beRepeated',
    importEnh: async () => {
        const {BeRepeated} = await import('./behance.js');
        return BeRepeated;
    }
};

const mose = document.createElement('script') as MOSE<EnhancementMountCnfg>;
mose.id = base;
mose.synConfig = emc;

MountObserver.synthesize(document, BeHive, mose);