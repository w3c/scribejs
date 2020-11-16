// @ts-nocheck
const a = () => {
    return 'namivan';
}

// eslint-disable-next-line no-cond-assign
if ((x = a()) !== null) {
    console.log(x);
}
