export const trPlugin = ({ target, val }) => {
};
trPlugin.doTransform = (fragment) => {
    const elements = Array.from(fragment.querySelectorAll('[be-repeated]'));
    for (const element of elements) {
        const ctx = {
            target: element,
            val: element.getAttribute('be-repeated'),
        };
    }
};
