import {stringify} from 'qs';

const formatStationBoardReq = (ctx, station, type) => {
	const {profile, opt} = ctx;

	if (opt.moreStops) {
		station += ',' + opt.moreStops.join(',');
	}

	const query = {
		// TODO direction, fields below
		modeOfTransport: profile.formatProductsFilter(ctx, opt.products || {}, 'ris'),
		timeStart: profile.formatTime(profile, opt.when, true),
		timeEnd: profile.formatTime(profile, opt.when.getTime() + opt.duration * 60 * 1000, true),
		expandTimeFrame: 'TIME_END', // TODO impact?
	};

	return {
		endpoint: profile.boardEndpoint,
		// repeated query params for array values (modeOfTransport=A&modeOfTransport=B),
		// matching the RIS/regio-guide OpenAPI form/explode convention
		path: (type == 'departures' ? 'departure' : 'arrival') + '/' + station + '?' + stringify(query, {arrayFormat: 'repeat', encodeValuesOnly: true}),
		method: 'get',
	};
};

export {
	formatStationBoardReq,
};
