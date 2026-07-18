import tap from 'tap';
import {
	checkIfResponseIsOk as checkIfResIsOk,
} from '../../lib/request.js';
import {
	HafasError,
	HafasNotFoundError,
} from '../../lib/errors.js';

const resNoMatch = {verbindungen: [], verbindungReference: {}, fehlerNachricht: {code: 'MDA-AK-MSG-1001', ueberschrift: 'Datum liegt außerhalb der Fahrplanperiode.', text: 'Das Datum liegt außerhalb der Fahrplanperiode.'}};

const secret = Symbol('secret');

tap.test('checkIfResponseIsOk properly throws HAFAS errors', (t) => {
	try {
		checkIfResIsOk({
			body: resNoMatch,
			errProps: {secret},
		});
	} catch (err) {
		t.ok(err);

		t.ok(err instanceof HafasError);
		t.equal(err.isHafasError, true);
		t.ok(err instanceof HafasError);
		t.equal(err.isCausedByServer, false);
		t.equal(err.code, 'MDA-AK-MSG-1001');

		t.equal(err.hafasMessage, 'Datum liegt außerhalb der Fahrplanperiode.');
		t.equal(err.hafasDescription, 'Das Datum liegt außerhalb der Fahrplanperiode.');

		t.end();
	}
});

tap.test('checkIfResponseIsOk handles an errors-only body without crashing', (t) => {
	// a body carrying `errors` but no `fehlerNachricht` must not throw a raw TypeError
	try {
		checkIfResIsOk({
			body: {errors: [{code: 'SOME_ERROR'}]},
			errProps: {},
		});
		t.fail('expected checkIfResponseIsOk to throw');
	} catch (err) {
		t.ok(err instanceof HafasError, 'is a HafasError, not a TypeError');
		t.equal(err.isHafasError, true);
		t.same(err.hafasErrors, [{code: 'SOME_ERROR'}]);
	}
	t.end();
});

tap.test('checkIfResponseIsOk classifies known HAFAS error codes into subclasses', (t) => {
	try {
		checkIfResIsOk({
			body: {fehlerNachricht: {code: 'H890', ueberschrift: 'no route', text: 'no route found'}},
			errProps: {},
		});
		t.fail('expected checkIfResponseIsOk to throw');
	} catch (err) {
		t.ok(err instanceof HafasNotFoundError, 'H890 maps to HafasNotFoundError');
		t.equal(err.code, 'NOT_FOUND');
		t.equal(err.hafasCode, 'H890');
		t.equal(err.shouldRetry, true);
		t.equal(err.isCausedByServer, false);
	}
	t.end();
});

