const dynamoose = require("dynamoose");

if (process.env.NODE_ENV === "development" && process.env.DYNAMODB_LOCAL_URL) {
    dynamoose.aws.ddb.local(process.env.DYNAMODB_LOCAL_URL);
} else {
    // Dynamoose will default to AWS credentials in production
}

export default dynamoose;