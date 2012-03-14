var mongoose = require('mongoose');

function paginate(query, page, count, cb) {
  query.skip(count * (page - 1));
  query.limit(count);
  query.exec('find', function findQueryResponse(err, results) {
    if (err) {
      cb(err);
    } else {
      query.exec('count', function countQueryResponse(err, total) {
        if (err) {
          cb(err);
        } else {
          cb(null, {
            pagination: calculatePagination(total, page, count, results),
            results: results
          });
        }
      });
    }
  });
}

function calculatePagination(total, page, count, results) {
  console.log("Stuff ", arguments);
  var pages = Math.floor(total / count);
  var start = (count * (page - 1));
  var length = results.length;
  var end = start + length;

  pages = pages > 0 ? pages : 1;
  start = start > 0 ? start : 1;

  return { start: start, end: end, total: total, page: page, pages: pages, count: results.length };
}

mongoose.Model.paginate = paginate;
