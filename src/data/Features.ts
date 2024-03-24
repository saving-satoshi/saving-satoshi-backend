import dynamoose from "./dynamoose";

const FeatureFlagSchema = new dynamoose.Schema({
    feature_name: {
        type: String,
        hashKey: true,
    },
    feature_value: Boolean,
}, {
    saveUnknown: true,
    timestamps: false,
});

const FeatureFlag = dynamoose.model("FeatureFlag", FeatureFlagSchema);

export default FeatureFlag;
