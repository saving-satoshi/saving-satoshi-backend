import Joi from 'joi'
import Model from 'lib/model'

class Feature extends Model {
  get table(): string {
    return 'features'
  }

  get schema(): Joi.ObjectSchema<any> {
    return Joi.object({
      feature_name: Joi.string().required(),
      feature_value: Joi.number(),
    })
  }
}

export default new Feature()
