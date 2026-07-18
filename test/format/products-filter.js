import tap from 'tap';
import {formatProductsFilter as format} from '../../format/products-filter.js';

const products = [
	{
		id: 'train',
		bitmasks: [1, 2],
		vendo: 'REGIONAL',
		ris: 'REGIONAL_TRAIN',
		dbnav: 'NAHVERKEHRSONSTIGEZUEGE',
		default: true,
	},
	{
		id: 'bus',
		bitmasks: [4],
		vendo: 'BUS',
		ris: 'BUS',
		dbnav: 'BUSSE',
		default: true,
	},
	{
		id: 'tram',
		bitmasks: [8, 32],
		vendo: 'TRAM',
		ris: 'TRAM',
		dbnav: 'STRASSENBAHN',
		default: false,
	},
];

const ctx = {
	common: {},
	opt: {},
	profile: {products},
};

tap.test('formatProductsFilter works without customisations', (t) => {
	const expected = ['REGIONAL', 'BUS'];
	const filter = {};
	t.same(format(ctx, filter), expected);
	t.end();
});

tap.test('formatProductsFilter returns undefined for key "ris" when nothing is deselected', (t) => {
	// with every product selected there is nothing to filter, so RIS gets no param
	t.equal(format(ctx, {train: true, bus: true, tram: true}, 'ris'), undefined);
	t.end();
});

tap.test('formatProductsFilter returns ["ALL"] for key "dbnav" when nothing is deselected', (t) => {
	t.same(format(ctx, {train: true, bus: true, tram: true}, 'dbnav'), ['ALL']);
	t.end();
});

tap.test('formatProductsFilter returns the explicit list for key "ris" on partial deselection', (t) => {
	t.same(format(ctx, {bus: false}, 'ris'), ['REGIONAL_TRAIN']);
	t.end();
});

tap.test('formatProductsFilter throws on an unknown product', (t) => {
	t.throws(() => format(ctx, {bogus: true}), /unknown product bogus/);
	t.end();
});

tap.test('formatProductsFilter throws when every product is deselected', (t) => {
	t.throws(() => format(ctx, {train: false, bus: false, tram: false}), /no products used/);
	t.end();
});

tap.test('formatProductsFilter throws when the filter is not an object', (t) => {
	t.throws(() => format(ctx, null), /products filter must be an object/);
	t.end();
});
