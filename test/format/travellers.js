import tap from 'tap';
import {formatTravellers} from '../../format/travellers.js';
import {ageGroup, ageGroupFromAge, ageGroupLabel} from '../../lib/age-group.js';
import {formatLoyaltyCard, data as cards} from '../../format/loyalty-cards.js';

const profile = {ageGroup, ageGroupFromAge, ageGroupLabel, formatLoyaltyCard};

tap.test('formatTravellers defaults to a single adult in 2nd class', (t) => {
	const res = formatTravellers({profile, opt: {}});
	t.equal(res.klasse, 'KLASSE_2');
	t.equal(res.reisende.length, 1);
	t.equal(res.reisende[0].typ, 'ERWACHSENER');
	t.same(res.reisende[0].alter, []);
	t.same(res.reisende[0].ermaessigungen, [{art: 'KEINE_ERMAESSIGUNG', klasse: 'KLASSENLOS'}]);
	t.end();
});

tap.test('formatTravellers treats age 0 as an infant (not an adult)', (t) => {
	const res = formatTravellers({profile, opt: {age: 0}});
	t.equal(res.reisende[0].typ, 'KLEINKIND');
	t.same(res.reisende[0].alter, ['0']);
	t.end();
});

tap.test('formatTravellers classifies a normal age', (t) => {
	const res = formatTravellers({profile, opt: {age: 30}});
	t.equal(res.reisende[0].typ, 'ERWACHSENER');
	t.same(res.reisende[0].alter, ['30']);
	t.end();
});

tap.test('formatTravellers accepts an explicit ageGroup', (t) => {
	const res = formatTravellers({profile, opt: {ageGroup: ageGroup.CHILD}});
	t.equal(res.reisende[0].typ, 'FAMILIENKIND');
	t.same(res.reisende[0].alter, []);
	t.end();
});

tap.test('formatTravellers uses 1st class when firstClass is set', (t) => {
	const res = formatTravellers({profile, opt: {firstClass: true}});
	t.equal(res.klasse, 'KLASSE_1');
	t.end();
});

tap.test('formatTravellers maps a loyalty card', (t) => {
	const res = formatTravellers({profile, opt: {loyaltyCard: {type: cards.BAHNCARD, discount: 25, class: 2}}});
	t.same(res.reisende[0].ermaessigungen, [{art: 'BAHNCARD25', klasse: 'KLASSE_2'}]);
	t.end();
});

tap.test('formatTravellers supports arrays of travellers', (t) => {
	const res = formatTravellers({profile, opt: {age: [0, 30]}});
	t.equal(res.reisende.length, 2);
	t.equal(res.reisende[0].typ, 'KLEINKIND');
	t.equal(res.reisende[1].typ, 'ERWACHSENER');
	t.end();
});

tap.test('formatTravellers rejects mismatched array lengths', (t) => {
	t.throws(
		() => formatTravellers({profile, opt: {age: [30, 40], loyaltyCard: [null]}}),
		/must be an array of the same length/,
	);
	t.end();
});

tap.test('formatTravellers rejects age together with ageGroup', (t) => {
	t.throws(
		() => formatTravellers({profile, opt: {age: 30, ageGroup: ageGroup.ADULT}}),
		/mutually exclusive/,
	);
	t.end();
});
