import {stringify} from 'qs';

const formatStationBoardReq = (ctx, station, type) => {
	const {profile, opt} = ctx;

	if (opt.whenExplicit) {
		throw new Error('opt.when is not supported for profile dbbahnhof, it can only query for the current time.');
	}
	const evaNumbers = [station];
	if (opt.moreStops) {
		evaNumbers.push(...opt.moreStops);
	}
	const query = {
		filterTransports: profile.formatProductsFilter(ctx, opt.products || {}, 'ris_alt'),
		evaNumbers: evaNumbers,
		duration: opt.duration,
		sortBy: 'TIME_SCHEDULE',
		locale: opt.language,
	};

	return {
		endpoint: profile.boardEndpoint,
		path: type + '?' + stringify(query, {arrayFormat: 'repeat', encodeValuesOnly: true}),
		method: 'get',
	};
};

export {
	formatStationBoardReq,
};
