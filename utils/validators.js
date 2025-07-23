const validator = require('validator'); // ✅ use 'validator' instead of 'express-validator' here
const isEmpty = require('lodash.isempty');

// Helper to check empty values
const empty = value => value === undefined || value === null || value === '';

const validateLoginInput = data => {
  let errors = {};

  data.email = !empty(data.email) ? data.email : '';
  data.password = !empty(data.password) ? data.password : '';

  if (validator.isEmpty(data.email)) {
    errors.email = 'Email field is required';
  } else if (!validator.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }

  if (validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

const validateUserInput = data => {
  let errors = {};

  data.name = !empty(data.name) ? data.name : '';
  data.email = !empty(data.email) ? data.email : '';
  data.password = !empty(data.password) ? data.password : '';
  data.role = !empty(data.role) ? data.role : '';

  if (validator.isEmpty(data.name)) {
    errors.name = 'Name field is required';
  }

  if (validator.isEmpty(data.email)) {
    errors.email = 'Email field is required';
  } else if (!validator.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }

  if (validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  if (validator.isEmpty(data.role)) {
    errors.role = 'Role field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

// const validateMemberInput = data => {
//   let errors = {};

//   data.name = !empty(data.name) ? data.name : '';
//   data.phone = !empty(data.phone) ? data.phone : '';
//   data.plan = !empty(data.plan) ? data.plan : '';

//   if (validator.isEmpty(data.name)) {
//     errors.name = 'Name field is required';
//   }

//   if (validator.isEmpty(data.phone)) {
//     errors.phone = 'Phone field is required';
//   }

//   if (validator.isEmpty(data.plan)) {
//     errors.plan = 'Plan field is required';
//   }

//   return {
//     errors,
//     isValid: isEmpty(errors)
//   };
// };
const validateMemberInput = (data) => {
  let errors = {};
  
  // Required fields
  if (!data.name) errors.name = 'Name is required';
  if (!data.phone) errors.phone = 'Phone number is required';
  if (!data.plan) errors.plan = 'Membership plan is required';
  
  // Format validation
  if (data.phone && !/^\d{10,15}$/.test(data.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Email is invalid';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateLoginInput,
  validateUserInput,
  validateMemberInput
};
