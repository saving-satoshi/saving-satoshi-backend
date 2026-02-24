import Joi from 'joi'

export function formatValidationErrors(error: Joi.ValidationError) {
  return error.details.map((d) => {
    return {
      key: d.path,
      message: d.message,
    }
  })
}
