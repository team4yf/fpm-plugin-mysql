'use strict';
const { Fpm, Biz } = require('yf-fpm-server');
const plugin = require('../src');
const path = require('path');

let app = new Fpm()
let M = plugin.bind(app)
let biz = new Biz('0.0.1');
biz.addSubModules('test',{
	foo: async (args) => {
		return new Promise( (resolve, reject) => {
			reject({errno: -3001});
		});
	}
})
app.addBizModules(biz);

app.runAction('INIT', app)

app.run().then(fpm=> {
	// M.init(path.join(fpm.get('CWD'), 'sql'))
	// 	.catch(e => {
	// 		console.error(e.toString())
	// 	})
	M.install(path.join(fpm.get('CWD'), 'sql'))
		.catch(e => {
			console.error(e.toString())
		})
	// M.install(path.join(fpm.get('CWD'), 'sql', 'test.sql'))
	// .catch(e => {
	// 	console.error(e.toString())
	// })
})
