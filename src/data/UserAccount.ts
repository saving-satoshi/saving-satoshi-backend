import dynamoose from "./dynamoose";

const UserAccountSchema = new dynamoose.Schema(
  {
    id: { type: String, hashKey: true, default: dynamoose.uuid },
    private_key: { type: String, required: true, index: { global: true, name: "PrivateKeyIndex" } },
    profile: {
      type: Object,
      schema: {
        difficultyLevel: { type: String, enum: ["beginner", "advanced"] },
        defaultLanguage: String,
      },
    },
    lessonProgress: {
      type: Array,
      schema: [
        {
          type: Object,
          schema: {
            lessonId: String,
            progress: {
              type: Array,
              schema: [
                {
                  type: Object,
                  schema: {
                    language: String,
                    difficulty: {
                      type: String,
                      enum: ["beginner", "advanced"],
                      required: true,
                    },
                    completed: Boolean,
                    answer: { type: String, required: false },
                    submittedCode: String,
                  },
                },
              ],
            },
          },
        },
      ],
    },
    currentLesson: String,
  },
  { saveUnknown: true, timestamps: true }
);

const UserAccount = dynamoose.model("UserAccount", UserAccountSchema);

export default UserAccount;