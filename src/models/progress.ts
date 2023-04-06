import Joi from 'joi'
import Model from 'lib/model'

class Progress extends Model {
  get table(): string {
    return 'accounts_progress'
  }

  get schema(): Joi.ObjectSchema<any> {
    return Joi.object({
      account: Joi.number().required,
      progress: Joi.string().length(8).required(),
    })
  }
}

export default new Progress()
