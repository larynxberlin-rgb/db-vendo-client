const parseProducts = ({profile}, products = []) => {
	const res = {};
	const list = products || [];
	for (let product of profile.products) {
		res[product.id] = Boolean(list.find(p => p == product.vendo || p == product.dbnav));
	}
	return res;
};

export {
	parseProducts,
};
