var _ = require('underscore');

var validators = {
  'GET /': {
    description: 'Get a news feed for user or public',
    returns: 'An array of events',
    errors: [
      {
        description: 'Request is in an invalid format.',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "validation", message: string }]}'
      }
    ],
    queryParameters: [
      {
        name: 'all',
        type: 'boolean',
        default: false,
        description: 'Show all events or only events against regos the user is watching'
      },
      {
        name: 'count',
        type: 'integer',
        min: 1,
        max: 100,
        default: 10,
        description: 'The number of events to return'
      },
      {
        name: 'page',
        type: 'integer',
        default: 1,
        description: 'The page of results (by count) to return'
      },
      {
        name: 'detailed',
        type: 'boolean',
        default: false,
        description: 'Should the responses be detailed'
      }
    ]
  },
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
    requirements: 'A logged in user',
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
  },
  'PUT /rego/:country/:state/:rego/watchers': {
    description: 'Watch a rego for changes',
    returns: 'The created watcher and the rego it was created against',
    requirements: 'A logged in user',
    errors: [
      {
        description: 'User is already watching this rego.',
        example: '{type: "validation", count: #, errors: [{ code: "already_watching", message: string }]}'
      },
      {
        description: 'Request is in an invalid format',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "validation", message: string }]}'
      }
    ],
    fields: [
      {
        name: 'email',
        type: 'boolean',
        required: true,
        description: 'true for instant email, false for in application only.'
      }
    ]
  },
  'PUT /rego/:country/:state/:rego/conversations': {
    description: 'Create a conversation on a rego',
    returns: 'The created conversation and rego it was created against',
    requirements: 'A logged in user',
    errors: [
      {
        description: 'Request is in an invalid format',
        example: '{type: "validation", count: #, errors: [{field: "field", code: "validation", message: string }]}'
      }
    ],
    fields: [
      {
        name: 'parentConversation',
        type: 'string',
        maxLength: 400,
        description: 'The parent conversations id'
      },
      {
        name: 'subject',
        type: 'string',
        maxLength: 150,
        description: 'The subject of the conversation'
      },
      {
        name: 'content',
        type: 'string',
        maxLength: 5000,
        required: true,
        description: 'The body of the conversation'
      }
    ]
  }
};
var regexLookupTable = [];
(function buildLookupTable() {
  _.each(validators, function (validator, key) {
    var newKey = '^' + key.replace(/\:[^\/]+/g, '[^/]+') + '$';
    regexLookupTable.push({ key: newKey, validator: validator });
  })
})();

var validationFns = {
  'string': validateString,
  'boolean': validateBoolean,
  'integer': validateInteger
}

function getValidatorUrl(req) {
  var validatorUrl = req.method.toUpperCase();
  validatorUrl += ' ';
  validatorUrl += req.path;
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

function findValidator(validatorUrl) {
  var item = _.find(regexLookupTable, function check(item) {
    return validatorUrl.match(item.key);
  });
  return item ? item.validator : null;
}

function requestParser(options) {
  return function parseRequest(req, res, next) {
    var validatorUrl = getValidatorUrl(req);
    var parts = getParts(validatorUrl);
    var validator = findValidator(validatorUrl);
    if (validator) {
      var result = validate(req, validator);
      if (result.validation.count > 0) {
        res.send(result.validation);
      } else {
        req.body = result.body;
        req.query = result.query;
        next();
      }
    } else if (isValidHelpUrl(parts)) {
      pleaseHelp(parts, req, res, next);
    } else {
      next();
    }
  };
}

function validate(req, validator) {
  var validationResult = { type: 'validation', count: 0, errors: [] };
  var result = { query: {}, body: {}, validation: validationResult };
  _.each(validator.fields, function validate(desc) {
    validationFns[desc.type](result, desc, req.body[desc.name], 'body');
  });
  _.each(validator.queryParameters, function validate(desc) {
    validationFns[desc.type](result, desc, req.query[desc.name], 'query');
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

function validateString(result, def, value, resultObject) {
  value = trimAll(value);
  if (!def.required && !value) {
    result[resultObject][def.name] = def.default;
  } else if (def.required && !value) {
    missingRequiredValue(result, def, value);
  } else if (value.length < def.minLength || value.length > def.maxLength) {
    lengthIncorrect(result, def, value);
  } else if (def.regex && !value.match(def.regex)) {
    regexNotMatching(result, def, value);
  } else {
    result[resultObject][def.name] = value;
  }
}

function validateBoolean(result, def, value, resultObject) {
  var actualValue = value;
  if (value === 'true') {
    actualValue = true;
  } else if (value === 'false') {
    actualValue = false
  }

  var isBoolean = _.isBoolean(actualValue);
  if (!def.required && !isBoolean) {
    result[resultObject][def.name] = def.default;
  } else if (def.required && !isBoolean) {
    missingRequiredValue(result, def, value);
  } else {
    result[resultObject][def.name] = actualValue;
  }
}

function validateInteger(result, def, value, resultObject) {
  var actualValue = parseInt(value, 10);
  var isNumber = _.isNumber(actualValue);
  if (!def.required && !isNumber) {
    result[resultObject][def.name] = def.default;
  } else if (def.required && !isNumber) {
    missingRequiredValue(result, def, value);
  } else if ((def.min && actualValue < def.min) || (def.max && actualValue > def.max)) {
    sizeIncorrect(result, def, actualValue);
  } else {
    result[resultObject][def.name] = actualValue;
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

function sizeIncorrect(result, def, actualValue) {
  var min = def.min;
  var max = def.max;
  var type = 'bad_size';
  var message;
  if (min && max) {
    message = (def.niceName || def.name) + ' must be between ' + min + ' and ' + max;
  } else if (max) {
    message = (def.niceName || def.name) + ' must be less than ' + max;
  } else if (min) {
    message = (def.niceName || def.name) + ' must be more than ' + min;
  }
  validationError(result, def, type, message);
}

function regexNotMatching(result, def, value) {
  validationError(result, def, 'regex_fail', 'The ' + (def.niceName || def.name) + ' should match ' + def.regex);
}

function pleaseHelp(parts, req, res, next) {
  var validator = findValidator(parts.base);
  if (parts.path === '') {
    res.send(validators);
  } else if (validator) {
    res.send(validator);
  } else {
    next();
  }
}

exports.requestParser = requestParser;
