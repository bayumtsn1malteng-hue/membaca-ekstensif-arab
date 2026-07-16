const connect = require('connect');
const serveStatic = require('serve-static');

connect ()
	.use(serveStatic('./dist'))
	.listen(8080, () => console.log(`Server running on 8080...`));

// '.dist' perlu diubah. Googling dulu apa maksud connect.user(serveStatic)
