/**
 * See routes defined in `config.json`.
 */


/**
 * Root response (general API status, docs URL).
 */
exports.root = function *(next) {
  this.body = {
    status: 'ok',
    documentation: 'http://docs.galaxy.apiary.io/'
  };

  yield next;
};
