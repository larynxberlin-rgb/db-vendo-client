const c = {
	NONE: Symbol('no loyalty card'),
	BAHNCARD: Symbol('Bahncard'),
	VORTEILSCARD: Symbol('VorteilsCard'),
	HALBTAXABO: Symbol('HalbtaxAbo'),
	VOORDEELURENABO: Symbol('Voordeelurenabo'),
	SHCARD: Symbol('SH-Card'),
	GENERALABONNEMENT: Symbol('General-Abonnement'),
	NL_40: Symbol('NL-40%'),
	AT_KLIMATICKET: Symbol('AT-KlimaTicket'),
};

const formatLoyaltyCard = (data) => {
	if (!data) {
		return {
			art: 'KEINE_ERMAESSIGUNG',
			klasse: 'KLASSENLOS',
		};
	}
	if (!data.type) {
		throw new TypeError('loyaltyCard.type is required.');
	}
	const cls = data.class === 1 ? 'KLASSE_1' : 'KLASSE_2';
	if (data.type.toString() === c.BAHNCARD.toString()) {
		return {
			art: 'BAHNCARD' + (data.business ? 'BUSINESS' : '') + data.discount,
			klasse: cls,
		};
	}
	if (data.type.toString() === c.VORTEILSCARD.toString()) {
		return {
			art: 'A-VORTEILSCARD',
			klasse: 'KLASSENLOS',
		};
	}
	if (data.type.toString() === c.HALBTAXABO.toString()) {
		return {
			art: 'CH-HALBTAXABO_OHNE_RAILPLUS',
			klasse: 'KLASSENLOS',
		};
	}
	if (data.type.toString() === c.GENERALABONNEMENT.toString()) {
		return {
			art: 'CH-GENERAL-ABONNEMENT',
			klasse: cls,
		};
	}
	if (data.type.toString() === c.NL_40.toString()) {
		return {
			art: 'NL-40_OHNE_RAILPLUS',
			klasse: 'KLASSENLOS',
		};
	}
	if (data.type.toString() === c.AT_KLIMATICKET.toString()) {
		return {
			art: 'KLIMATICKET_OE',
			klasse: 'KLASSENLOS',
		};
	}
	// A known-but-unmapped card type (e.g. Voordeelurenabo, SH-Card) must not be
	// silently downgraded to "no discount" — that would quietly charge the full fare.
	throw new TypeError('unsupported loyalty card type: ' + (data.type.description || data.type.toString()));
};
export {
	c as data,
	formatLoyaltyCard,
};
