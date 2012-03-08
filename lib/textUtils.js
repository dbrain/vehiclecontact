function normaliseRego(rego) {
  if (rego && rego.trim().length > 0) {
    rego = rego || '';
    rego = rego.toLowerCase();
    rego = rego.replace(/[^a-z0-9]/g, '');
  } else {
    rego = null;
  }
  return rego;
}

function prettifyRego(rego) {
  if (rego && rego.trim().length > 0) {
    rego = rego.toUpperCase();
  } else {
    rego = null;
  }
  return rego;
}

exports.normaliseRego = normaliseRego;
exports.prettifyRego = prettifyRego;
