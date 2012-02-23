function createUserResponse(user) {
  var cleanUser = {
    _id: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
  };
  return { status: 'ok', user: cleanUser };
}

function createRegoResponse(rego) {
  var cleanRego = {
    _id: rego._id,
    rego: rego.rego,
    state: rego.state,
    country: rego.country
  };
  return { status: 'ok', rego: cleanRego };
}

exports.createUserResponse = createUserResponse;
exports.createRegoResponse = createRegoResponse;
