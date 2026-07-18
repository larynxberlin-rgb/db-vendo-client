import {getHeaders} from './header.js';

const formatStopReq = (ctx, stopRef) => {
	const {profile} = ctx;

	return {
		endpoint: profile.stopEndpoint,
		path: encodeURIComponent(stopRef),
		headers: getHeaders('application/x.db.vendo.mob.location.v3+json'),
		method: 'get',
	};
};

export {
	formatStopReq,
};
