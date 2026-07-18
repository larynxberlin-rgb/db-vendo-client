const formatTraveller = ({profile}, ageGroup, age, loyaltyCard) => {
	// age 0 (an infant) is a valid value, so test for presence, not truthiness
	const hasAge = age !== undefined && age !== null;
	const tvlrAgeGroup = hasAge
		? profile.ageGroupFromAge(age)
		: ageGroup;
	let r = {
		typ: profile.ageGroupLabel[tvlrAgeGroup || profile.ageGroup.ADULT],
		anzahl: 1,
		alter: hasAge
			? [String(age)]
			: [],
		ermaessigungen: [profile.formatLoyaltyCard(loyaltyCard)],
	};
	return r;
};

const validateArr = (field, length) => {
	return !field || Array.isArray(field) && field.length == length;
};

const formatTravellers = ({profile, opt}) => {
	if ('age' in opt && 'ageGroup' in opt) {
		throw new TypeError(`\
opt.age and opt.ageGroup are mutually exclusive.
Pass in just opt.age, and the age group will calculated automatically.`);
	}
	let travellers = [];
	if (Array.isArray(opt.loyaltyCard) || Array.isArray(opt.age) || Array.isArray(opt.ageGroup)) {
		const len = opt.loyaltyCard?.length || opt.age?.length || opt.ageGroup?.length;
		if (!validateArr(opt.loyaltyCard, len) || !validateArr(opt.age, len) || !validateArr(opt.ageGroup, len)) {
			throw new TypeError('If any of loyaltyCard, age or ageGroup are an array, all given must be an array of the same length.');
		}
		for (let i = 0; i < len; i++) {
			travellers.push(formatTraveller({profile}, opt.ageGroup && opt.ageGroup[i], opt.age && opt.age[i], opt.loyaltyCard && opt.loyaltyCard[i]));
		}
	} else {
		travellers.push(formatTraveller({profile}, opt.ageGroup, opt.age, opt.loyaltyCard));
	}

	const basicCtrfReq = {
		klasse: opt.firstClass === true ? 'KLASSE_1' : 'KLASSE_2',
		reisende: travellers,
	};
	return basicCtrfReq;
};

export {
	formatTravellers,
};
