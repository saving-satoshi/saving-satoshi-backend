import Joi from 'joi'
import Model from 'lib/model'

class Account extends Model {
  get table(): string {
    return 'accounts'
  }

  get schema(): Joi.ObjectSchema<any> {
    return Joi.object({
      avatar: Joi.string().uri(),
      private_key: Joi.string().min(64).max(64).required(),
    })
  }
}

export default new Account()
