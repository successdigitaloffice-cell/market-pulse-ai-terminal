const t = require('../tradeTrackingService');
const sigs = t.getSignals();
console.log(JSON.stringify(sigs, null, 2));
