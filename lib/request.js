import {stringify} from 'qs';
import https from 'https';
import {Request, fetch} from 'cross-fetch';
import {parse as parseContentType} from 'content-type';
import {HafasError, byErrorCode} from './errors.js';

const proxyAddress = typeof process !== 'undefined' && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) || null;

// cross-fetch uses node-fetch@2, which only speaks HTTP/1.1. Hosts like
// app.services-bahn.de (Akamai) negotiate HTTP/2 over TLS whenever the client
// offers `h2` via ALPN, after which node-fetch tries to parse the HTTP/2 binary
// frames with its HTTP/1.1 parser and throws
// `HPE_INVALID_CONSTANT` ("Expected HTTP/..."). Pin ALPN to http/1.1 so
// the connection can never negotiate a protocol we cannot read, regardless of
// how https.globalAgent is configured.
// See https://github.com/public-transport/db-vendo-client/issues/53
let defaultAgent;
const getDefaultAgent = () => {
	if (!defaultAgent && https.Agent) {
		const agentOpts = {ALPNProtocols: ['http/1.1']};
		// scope the DB cipher list to this client's own connections instead of
		// mutating the process-global tls.DEFAULT_CIPHERS
		if (process.env.DB_PROFILE == 'db') {
			agentOpts.ciphers = ciphers;
		}
		defaultAgent = new https.Agent(agentOpts);
	}
	return defaultAgent;
};

let proxyConfigured = false;
let getAgent = () => getDefaultAgent();

const ciphers = [
	'TLS_AES_128_GCM_SHA256',
	'TLS_AES_256_GCM_SHA384',
	'TLS_CHACHA20_POLY1305_SHA256',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-CHACHA20-POLY1305',
	'ECDHE-RSA-CHACHA20-POLY1305',
	'ECDHE-RSA-AES128-SHA',
	'ECDHE-RSA-AES256-SHA',
	'AES128-GCM-SHA256',
	'AES256-GCM-SHA384',
	'AES128-SHA',
	'AES256-SHA',
].join(':');

const setupProxy = async () => {
	if (proxyAddress && !proxyConfigured) {
		const a = await import('https-proxy-agent');
		const agent = new a.default.HttpsProxyAgent(proxyAddress, {
			keepAlive: true,
			keepAliveMsecs: 10 * 1000, // 10s
			ALPNProtocols: ['http/1.1'],
			...(process.env.DB_PROFILE == 'db' ? {ciphers} : {}),
		});
		getAgent = () => agent;
		proxyConfigured = true;
	}
};

const randomBytesHexString = length => [...Array(length)].map(() => Math.floor(Math.random() * 16)
	.toString(16))
	.join('');

const id = randomBytesHexString(6);
const randomizeUserAgent = (userAgent) => {
	let ua = userAgent;
	for (
		let i = Math.round(5 + Math.random() * 5);
		i < ua.length;
		i += Math.round(5 + Math.random() * 5)
	) {
		ua = ua.slice(0, i) + id + ua.slice(i);
		i += id.length;
	}
	return ua;
};

const checkIfResponseIsOk = (_) => {
	const {
		body,
		errProps: baseErrProps,
	} = _;

	const errProps = {
		...baseErrProps,
	};
	if (body.id) {
		errProps.hafasResponseId = body.id;
	}

	// Because we want more accurate stack traces, we don't construct the error here,
	// but only return the constructor & error message.
	const getError = (_) => {
		// the error body may use the `fehlerNachricht` shape or only carry `errors`
		const fn = _.fehlerNachricht || {};
		// mutating here is ugly but pragmatic
		if (fn.ueberschrift) {
			errProps.hafasMessage = fn.ueberschrift;
		}
		if (fn.text) {
			errProps.hafasDescription = fn.text;
		}
		return {
			Error: HafasError,
			message: errProps.hafasMessage || 'unknown error',
			props: {code: fn.code},
		};
	};

	if (body.fehlerNachricht || body.errors) { // TODO better handling
		const {message, props} = getError(body);
		if (body.errors) {
			errProps.hafasErrors = body.errors;
		}
		const rawCode = props.code;
		// classify known HAFAS error codes into the documented error subclasses
		// (setting code/isCausedByServer/shouldRetry); fall back to a generic HafasError
		const mapped = rawCode ? byErrorCode[rawCode] : null;
		if (mapped) {
			throw new mapped.Error(errProps.hafasMessage || mapped.message, rawCode, {...errProps, ...mapped.props});
		}
		throw new HafasError(message, rawCode, {...errProps, ...props});
	}
};

const request = async (ctx, userAgent, reqData) => {
	const {profile, opt} = ctx;
	await setupProxy();

	// note: do not `delete reqData.endpoint` here — the retry wrapper reuses the same
	// reqData object across attempts, so mutating it would break subsequent retries
	const endpoint = reqData.endpoint;
	const rawReqBody = profile.transformReqBody(ctx, reqData.body);

	const reqOptions = profile.transformReq(ctx, {
		agent: getAgent(),
		keepalive: true,
		method: reqData.method,
		// todo: CORS? referrer policy?
		body: JSON.stringify(rawReqBody),
		headers: {
			'Content-Type': 'application/json',
			// 'Accept-Encoding': 'gzip, deflate, br, zstd',
			'Accept': 'application/json',
			'Accept-Language': opt.language || profile.defaultLanguage || 'en',
			'user-agent': profile.randomizeUserAgent
				? randomizeUserAgent(userAgent)
				: userAgent,
			...reqData.headers,
		},
		redirect: 'follow',
		query: reqData.query,
	});

	let url = endpoint + (reqData.path || '');
	if (reqOptions.query) {
		url += '?' + stringify(reqOptions.query, {arrayFormat: 'brackets', encodeValuesOnly: true});
	}
	const reqId = randomBytesHexString(6);
	const fetchReq = new Request(url, reqOptions);
	profile.logRequest(ctx, fetchReq, reqId);

	const res = await fetch(url, reqOptions);

	const errProps = {
		// todo [breaking]: assign as non-enumerable property
		request: fetchReq,
		// todo [breaking]: assign as non-enumerable property
		response: res,
		url,
	};

	if (!res.ok) {
		// todo [breaking]: make this a FetchError or a HafasClientError?
		const resBody = await res.text();
		if (profile.DEBUG) {
			console.error('HTTP ' + res.status + ' ' + res.statusText + ': ' + resBody);
		}
		const err = new Error(res.statusText);
		Object.assign(err, errProps, {statusCode: res.status, responseBody: resBody});
		throw err;
	}

	let cType = res.headers.get('content-type');
	if (cType) {
		const {type} = parseContentType(cType);
		// For some reason, the reqOptions.headers object is sometimes a plain object
		// and sometimes a Headers object (In browser env). For the latter, .get() must
		// be used.
		const accept = typeof reqOptions.headers.get === 'function'
			? reqOptions.headers.get('Accept')
			: reqOptions.headers['Accept'];
		if (type !== accept) {
			throw new HafasError('invalid/unsupported response content-type: ' + cType, null, errProps);
		}
	}

	const body = await res.text();
	profile.logResponse(ctx, res, body, reqId);

	let b;
	try {
		b = JSON.parse(body);
	} catch (err) {
		throw new HafasError('response is not valid JSON: ' + err.message, null, {...errProps, responseBody: body.slice(0, 500)});
	}
	checkIfResponseIsOk({
		body: b,
		errProps,
	});
	return {
		res: b,
		common: {},
	};
};

export {
	checkIfResponseIsOk,
	request,
};
