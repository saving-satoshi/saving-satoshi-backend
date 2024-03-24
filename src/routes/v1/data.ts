import { Router } from 'express';
import { authenticated } from 'middleware';
import { RequestWithToken } from 'types';
import UserAccount from '../../data/UserAccount';

const router = Router();

// Get user's profile
router.get('/profile', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    res.status(200).json(userAccount.profile);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

// Get all user's lesson progress
router.get('/lesson-progress', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    res.status(200).json(userAccount.lessonProgress);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

// Get user's progress for a specific lesson
router.get('/lesson-progress/:lessonId', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const lessonId = req.params.lessonId;

    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    const lesson = userAccount.lessonProgress.find((lesson) => lesson.lessonId === lessonId);

    if (!lesson) {
      return res.status(404).json({
        errors: [{ message: 'Lesson progress not found' }],
      });
    }

    res.status(200).json(lesson);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

// Get user's current lesson
router.get('/current-lesson', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    res.status(200).json(userAccount.currentLesson);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

// Update user's profile
router.put('/update-profile', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const { difficultyLevel, defaultLanguage } = req.body;

    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    userAccount.profile.difficultyLevel = difficultyLevel;
    userAccount.profile.defaultLanguage = defaultLanguage;

    await userAccount.save();

    res.status(200).json(userAccount.profile);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

// Update user's lesson progress
router.put('/update-lesson-progress', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const { lessonId, language, difficulty, completed, answer, submittedCode } = req.body;

    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    const lessonIndex = userAccount.lessonProgress.findIndex((lesson) => lesson.lessonId === lessonId);

    if (lessonIndex === -1) {
      userAccount.lessonProgress.push({
        lessonId,
        progress: [
          {
            language,
            difficulty,
            completed,
            answer,
            submittedCode,
          },
        ],
      });
    } else {
      const progressIndex = userAccount.lessonProgress[lessonIndex].progress.findIndex(
        (prog) => prog.language === language && prog.difficulty === difficulty
      );

      if (progressIndex === -1) {
        userAccount.lessonProgress[lessonIndex].progress.push({
          language,
          difficulty,
          completed,
          answer,
          submittedCode,
        });
      } else {
        userAccount.lessonProgress[lessonIndex].progress[progressIndex] = {
          language,
          difficulty,
          completed,
          answer,
          submittedCode,
        };
      }
    }

    await userAccount.save();

    res.status(200).json(userAccount.lessonProgress);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

// Update user's current lesson
router.put('/update-current-lesson', authenticated, async (req: RequestWithToken, res) => {
  try {
    const userId = req.account.id;
    const { currentLesson } = req.body;

    const userAccount = await UserAccount.get(userId);

    if (!userAccount) {
      return res.status(404).json({
        errors: [{ message: 'User account not found' }],
      });
    }

    userAccount.currentLesson = currentLesson;

    await userAccount.save();

    res.status(200).json(userAccount.currentLesson);
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

export default router;