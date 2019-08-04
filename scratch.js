const a = '-> http://www.w.w. Something essential to link to';

function cut(s) {
    const words = s.trim().split(' ');
    if (words.length >= 3 && words[0] === '->') {
        const url = words[1];
        const link = words.slice(2).join(' ');
        // check whether the URL is a proper one?
        return `See [${link}](${url})`;
    // eslint-disable-next-line no-else-return
    } else {
        return s;
    }
}

console.log(cut(a));
