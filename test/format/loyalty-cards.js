import tap from 'tap';
import {formatLoyaltyCard, data as cards} from '../../format/loyalty-cards.js';

tap.test('formatLoyaltyCard returns "no discount" for a missing card', (t) => {
	t.same(formatLoyaltyCard(undefined), {art: 'KEINE_ERMAESSIGUNG', klasse: 'KLASSENLOS'});
	t.same(formatLoyaltyCard(null), {art: 'KEINE_ERMAESSIGUNG', klasse: 'KLASSENLOS'});
	t.end();
});

tap.test('formatLoyaltyCard maps a BahnCard', (t) => {
	t.same(formatLoyaltyCard({type: cards.BAHNCARD, discount: 25, class: 2}), {art: 'BAHNCARD25', klasse: 'KLASSE_2'});
	t.same(formatLoyaltyCard({type: cards.BAHNCARD, discount: 50, class: 1}), {art: 'BAHNCARD50', klasse: 'KLASSE_1'});
	t.end();
});

tap.test('formatLoyaltyCard maps the Austrian/Swiss/Dutch cards it supports', (t) => {
	t.same(formatLoyaltyCard({type: cards.VORTEILSCARD}), {art: 'A-VORTEILSCARD', klasse: 'KLASSENLOS'});
	t.same(formatLoyaltyCard({type: cards.AT_KLIMATICKET}), {art: 'KLIMATICKET_OE', klasse: 'KLASSENLOS'});
	t.same(formatLoyaltyCard({type: cards.NL_40}), {art: 'NL-40_OHNE_RAILPLUS', klasse: 'KLASSENLOS'});
	t.end();
});

tap.test('formatLoyaltyCard throws for a card object without a type', (t) => {
	t.throws(() => formatLoyaltyCard({class: 1}), /loyaltyCard\.type is required/);
	t.end();
});

tap.test('formatLoyaltyCard throws (instead of silently dropping the discount) for a known-but-unmapped card', (t) => {
	// SH-Card and Voordeelurenabo are accepted by the REST enum but have no backend
	// mapping yet — they must not silently fall back to "no discount".
	t.throws(() => formatLoyaltyCard({type: cards.SHCARD}), /unsupported loyalty card type/);
	t.throws(() => formatLoyaltyCard({type: cards.VOORDEELURENABO}), /unsupported loyalty card type/);
	t.end();
});
