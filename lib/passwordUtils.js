var crypto = require('crypto');

function comparePassword(password, enteredPassword, cb) {
  process.nextTick(function comparePassword() {
    hashPasswordWithSalt(enteredPassword, password.salt, function checkHash(err, result) {
      if (err) {
        cb(err);
      } else {
        cb(null, (result.hash === password.hash));
      }
    });
  });
}

function hashPasswordWithSalt(password, salt, cb) {
  var hash = crypto.createHash('sha1');
  hash.update(salt);
  hash.update(password);
  var hashedPassword = hash.digest('base64');
  cb(null, { salt: salt, hash: hashedPassword });
}

function hashPassword(password, cb) {
  crypto.randomBytes(16, function encodePassword(err, keyBuf) {
    if (err) {
      cb(err);
    } else {
      hashPasswordWithSalt(password, keyBuf.toString(), cb);
    }
  });
}

exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
