import Joi from 'joi'
import Model from 'lib/model'

class Data extends Model {
  get table(): string {
    return 'data'
  }

  get schema(): Joi.ObjectSchema<any> {
    return Joi.object({
      lesson_id: Joi.string().length(8).required,
      value: Joi.any().required(),
    })
  }
}

export default new Data()

