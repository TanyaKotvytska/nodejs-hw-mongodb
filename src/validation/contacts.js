import Joi from 'joi';

export const createContactSchema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages({
        'string.base': 'Name should be a string',
        'string.min': 'Name should have at least {#limit} characters',
        'string.max': 'Name should have at most {#limit} characters',
        'any.required': 'Name is required',
    }),
    phoneNumber: Joi.string().min(3).max(20).required().messages({
        'string.base': 'Phonenumber should be a string',
        'string.min': 'Phonenumber should have at least {#limit} characters',
        'string.max': 'Phonenumber should have at most {#limit} characters',
        'any.required': 'Phonenumber is required',
    }),
    email: Joi.string().email().optional().messages({
        'string.email': 'Email must be a valid email address',
    }),
    isFavourite: Joi.boolean().optional().messages({
        'boolean.base': 'IsFavourite should be a boolean value',
    }),
    contactType: Joi.string().valid('personal', 'home', 'work').required().messages({
        'any.only': 'Contact type must be one of [work, home, personal]',
        'any.required': 'Contact type is required',
    }),
});

export const updateContactSchema = Joi.object({
    name: Joi.string().min(3).max(30).optional().messages({
        'string.base': 'Name should be a string',
        'string.min': 'Name should have at least {#limit} characters',
        'string.max': 'Name should have at most {#limit} characters',
    }),
    phoneNumber: Joi.string().min(3).max(20).optional().messages({
        'string.base': 'Phonenumber should be a string',
        'string.min': 'Phonenumber should have at least {#limit} characters',
        'string.max': 'Phonenumber should have at most {#limit} characters',
    }),
    email: Joi.string().email().optional().messages({
        'string.email': 'Email must be a valid email address',
    }),
    isFavourite: Joi.boolean().optional().messages({
        'boolean.base': 'IsFavourite should be a boolean value',
    }),
    contactType: Joi.string().valid('personal', 'home', 'work').optional().messages({
        'any.only': 'Contact type must be one of [work, home, personal]',
    }),
}).or('name', 'phoneNumber', 'email', 'isFavourite', 'contactType');
