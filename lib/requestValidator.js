var _ = require('underscore');

var validators = {
  'PUT /user': {
    description: 'Create a user',
    returns: 'The created user',
    errors: [
      {
        description: 'Username or email address already in use.',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "already_in_use", message: string }]}'
      },
      {
        description: 'Request is in an invalid format.',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "validation", message: string }]}'
      }
    ],
    fields: [
      {
        name: 'email',
        type: 'string',
        maxLength: 200,
        regex: '',
        required: true,
        niceName: 'email address',
        description: 'The users email address'
      },
      {
        name: 'username',
        type: 'string',
        maxLength: 100,
        required: true,
        description: 'The username'
      },
      {
        name: 'name',
        type: 'string',
        maxLength: 255,
        required: false,
        niceName: 'full name',
        description: 'The users full name'
      },
      {
        name: 'password',
        type: 'string',
        maxLength: 255,
        required: true,
        description: 'The users password'
      }
    ]
  },
  'PUT /rego': {
    description: 'Create a rego',
    returns: 'The created rego',
    errors: [
      {
        description: 'Rego already exists in state and country.',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "already_in_use", message: string }]}'
      },
      {
        description: 'Request is in an invalid format',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "validation", message: string }]}'
      }
    ],
    fields: [
      {
        name: 'rego',
        type: 'string',
        maxLength: 25,
        required: true,
        description: 'The vehicle registration'
      },
      {
        name: 'state',
        type: 'string',
        maxLength: 150,
        required: true,
        description: 'The state of registration'
      },
      {
        name: 'country',
        type: 'string',
        maxLength: 25,
        required: true,
        description: 'The country of registration'
      }
    ]
  }
};

var validationFns = {
  'string': validateString
}

function getValidatorUrl(req) {
  var validatorUrl = req.method.toUpperCase();
  validatorUrl += ' ';
  validatorUrl += req.url;
  return validatorUrl;
}

function getParts(url) {
  var helpPart = url.substring(url.length - 5);
  var normalPart = url.substring(0, url.length - 5);
  var urlPart = url.substring(url.indexOf(' ') + 1, url.length - 5);
  return { help: helpPart, base: normalPart, path: urlPart };
}

function isValidHelpUrl(parts) {
  return parts.help === '/help' && (parts.path === '' || validators[parts.base])
}

function requestParser(options) {
  return function parseRequest(req, res, next) {
    var validatorUrl = getValidatorUrl(req);
    var parts = getParts(validatorUrl);
    var validator = validators[validatorUrl];
    if (validator) {
      var result = validate(req.body, validator);
      if (result.validation.count > 0) {
        res.send(result.validation);
      } else {
        req.body = result.body;
        next();
      }
    } else if (isValidHelpUrl(parts)) {
      pleaseHelp(parts, req, res, next);
    } else {
      next();
    }
  };
}

function validate(body, validator) {
  var validationResult = { type: 'validation', count: 0, errors: [] };
  var result = { body: {}, validation: validationResult };
  _.each(validator.fields, function validate(desc) {
    validationFns[desc.type](result, desc, body[desc.name]);
  });
  return result;
}

function trimAll(value) {
  value = rtrim(value);
  value = ltrim(value);
  return value;
}

function rtrim(value) {
  if (_.isString(value)) {
    value = value.replace(/\s+$/g, '');
  }
  return value;
}

function ltrim(value) {
  if (_.isString(value)) {
    value = value.replace(/^\s+/g, '');
  }
  return value;
}

function validateString(result, def, value) {
  value = trimAll(value);
  if (!def.required && !value) {
    return;
  } else if (def.required && !value) {
    missingRequiredValue(result, def, value);
  } else if (value.length < def.minLength || value.length > def.maxLength) {
    lengthIncorrect(result, def, value);
  } else if (def.regex && !value.match(def.regex)) {
    regexNotMatching(result, def, value);
  } else {
    result.body[def.name] = value;
  }
}

function validationError(result, def, type, message) {
  var validation = result.validation;
  validation.count++;
  validation.errors.push({
    field: def.name,
    type: type,
    message: message
  });
}

function missingRequiredValue(result, def, value) {
  validationError(result, def, 'missing_required', 'Missing required field ' + (def.niceName || def.name));
}

function lengthIncorrect(result, def, value) {
  var minLength = def.minLength;
  var maxLength = def.maxLength;
  var type = 'bad_length';
  var message;
  if (minLength && maxLength) {
    message = (def.niceName || def.name) + ' must be between ' + minLength + ' and ' + maxLength + ' characters';
  } else if (maxLength) {
    message = (def.niceName || def.name) + ' must be less than ' + maxLength + ' characters';
  } else if (minLength) {
    message = (def.niceName || def.name) + ' must be more than ' + minLength + ' characters';
  }
  validationError(result, def, type, message);
}

function regexNotMatching(result, def, value) {
  validationError(result, def, 'regex_fail', 'The ' + (def.niceName || def.name) + ' should match ' + def.regex);
}

function pleaseHelp(parts, req, res, next) {
  if (parts.path === '') {
    res.send(validators);
  } else if (validators[parts.base]) {
    res.send(validators[parts.base]);
  } else {
    next();
  }
}

exports.requestParser = requestParser;
