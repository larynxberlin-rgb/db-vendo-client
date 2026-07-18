const types = {
	locale: 'string',
	timezone: 'string',

	request: 'function',
	transformReq: 'function',
	transformReqBody: 'function',

	formatStationBoardReq: 'function',
	formatLocationsReq: 'function',
	formatStopReq: 'function',
	formatTripReq: 'function',
	formatRefreshJourneyReq: 'function',
	formatJourneysReq: 'function',
	formatNearbyReq: 'function',
	transformJourneysQuery: 'function',

	products: 'array',

	parseDateTime: 'function',
	parseDeparture: 'function',
	parseArrival: 'function',
	parseJourneyLeg: 'function',
	parseJourney: 'function',
	parseLine: 'function',
	parseStationName: 'function',
	parseLocation: 'function',
	parsePolyline: 'function',
	parseOperator: 'function',
	parseRemarks: 'function',
	parseStopover: 'function',
	parseStop: 'function',
	parseTrip: 'function',

	formatAddress: 'function',
	formatCoord: 'function',
	formatDate: 'function',
	formatLocationFilter: 'function',
	formatProductsFilter: 'function',
	formatPoi: 'function',
	formatStation: 'function',
	formatTime: 'function',
	formatLocation: 'function',
	formatRectangle: 'function',
};

const validateProfile = (profile) => {
	for (let key of Object.keys(types)) {
		const type = types[key];
		if (type === 'array') {
			if (!Array.isArray(profile[key])) {
				throw new TypeError(`profile.${key} must be an array.`);
			}
		} else if (type !== typeof profile[key]) {
			throw new TypeError(`profile.${key} must be a ${type}.`);
		}
	}

	if (!Array.isArray(profile.products)) {
		throw new TypeError('profile.products must be an array.');
	}
	if (profile.products.length === 0) {
		throw new Error('profile.products is empty.');
	}
	for (let product of profile.products) {
		if ('string' !== typeof product.id) {
			throw new TypeError('profile.products[].id must be a string.');
		}
		if ('boolean' !== typeof product.default) {
			throw new TypeError('profile.products[].default must be a boolean.');
		}
		if (!Array.isArray(product.bitmasks)) {
			throw new TypeError(product.id + '.bitmasks must be an array.');
		}
		for (let bitmask of product.bitmasks) {
			if ('number' !== typeof bitmask) {
				throw new TypeError(product.id + '.bitmasks[] must be a number.');
			}
		}
	}

	if ('trip' in profile && 'boolean' !== typeof profile.trip) {
		throw new Error('profile.trip must be a boolean.');
	}
	if ('refreshJourney' in profile && 'boolean' !== typeof profile.refreshJourney) {
		throw new Error('profile.refreshJourney must be a boolean.');
	}
	if ('tripsByName' in profile && 'boolean' !== typeof profile.tripsByName) {
		throw new Error('profile.tripsByName must be a boolean.');
	}
	if ('journeyLeg' in profile) {
		throw new Error('profile.journeyLeg has been removed. Use profile.trip.');
	}
};

export {
	validateProfile,
};
