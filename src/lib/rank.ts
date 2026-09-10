const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;
const MID = ALPHABET[Math.floor(BASE / 2)];

function charAt(value: string, index: number) {
	return index < value.length ? ALPHABET.indexOf(value[index]) : -1;
}

export function first() {
	return MID;
}

export function between(left: string | null, right: string | null): string {
	if (!left && !right) return first();
	if (!left) return before(right as string);
	if (!right) return after(left);
	if (left >= right) return after(left);

	let rank = "";
	for (let index = 0; ; index += 1) {
		const leftCode = charAt(left, index);
		const rightCode = index < right.length ? ALPHABET.indexOf(right[index]) : BASE;
		if (leftCode === rightCode) {
			rank += ALPHABET[leftCode];
			continue;
		}
		const middle = Math.floor((leftCode + rightCode) / 2);
		if (middle > leftCode) return `${rank}${ALPHABET[middle]}`;
		rank += ALPHABET[Math.max(leftCode, 0)];
	}
}

export function after(left: string) {
	const lastCode = ALPHABET.indexOf(left[left.length - 1]);
	if (lastCode < BASE - 1) return `${left.slice(0, -1)}${ALPHABET[lastCode + 1]}`;
	return `${left}${MID}`;
}

export function before(right: string) {
	const firstCode = ALPHABET.indexOf(right[0]);
	if (right.length === 1 && firstCode > 0) return ALPHABET[Math.floor(firstCode / 2)];
	if (firstCode > 0 && right.length === 1) return ALPHABET[firstCode - 1];
	return between(null, null) < right ? `${ALPHABET[Math.max(firstCode - 1, 0)]}${MID}` : `0${MID}`;
}

export function sortByRank<T extends { rank: string }>(items: T[]) {
	return [...items].sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
}
