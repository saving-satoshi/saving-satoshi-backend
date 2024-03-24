import Joi from 'joi';
import { Router } from 'express';
import { formatValidationErrors } from 'lib/utils';
import FeatureFlag from '../../data/Features';


const router = Router();

const schema = Joi.object({
  feature_name: Joi.string().required(),
  feature_value: Joi.boolean().required(),
});

router.put('/', async (req, res) => {
  try {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      });
    }

    const featureName = req.body.feature_name;
    const featureValue = req.body.feature_value;

    // Check if the feature with the given name already exists
    const existingFeature = await FeatureFlag.get(featureName);

    if (existingFeature) {
      // Update the existing feature
      existingFeature.feature_value = featureValue;
      await existingFeature.save();

      return res.status(200).json(existingFeature);
    }

    // Create a new feature
    const newFeature = await FeatureFlag.create({
      feature_name: featureName,
      feature_value: featureValue,
    });

    res.status(200).json(newFeature);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

router.get('/', async (req, res) => {
  try {
    // Fetch all feature flags
    const features = await FeatureFlag.scan().exec();

    res.status(200).json(features);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

export default router;