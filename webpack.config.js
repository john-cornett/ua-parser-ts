/**
 * @author: @AngularClass
 */

switch (process.env.NODE_ENV) {
  case 'test':
  case 'testing':
    module.exports = require('./config/webpack.test');
    break;
  default:
    module.exports = require('./config/webpack.default');
}

