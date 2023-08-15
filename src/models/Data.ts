import Joi from 'joi'
import Model from 'lib/model'

class Data extends Model {
  get table(): string {
    return 'accounts_data'
  }

  get schema(): Joi.ObjectSchema<any> {
    return Joi.object({
      lesson_id: Joi.string().length(8).required,
      account_id: Joi.number().required,
      data: Joi.any().required(),
    })
  }
}

export default new Data()

