export default function () {
    const args = Array.from(arguments);
    const strings = args.slice(0, -1);
    return strings.join('');
}
