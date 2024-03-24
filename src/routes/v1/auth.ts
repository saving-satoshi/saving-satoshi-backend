import Joi from 'joi';
import { Router } from 'express';
import { formatValidationErrors } from 'lib/utils';
import { generate } from 'lib/token';
import { authenticated } from 'middleware';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_SETTINGS,
} from 'lib/cookie';
import { RequestWithToken } from 'types/index';
import UserAccount from '../../data/UserAccount';

const router = Router();

const schema = Joi.object({
  private_key: Joi.string().min(64).max(64).required(),
});

router.post('/register', async (req, res) => {
  try {
    const { error } = schema.validate(req.body, { abortEarly: false });
    console.log(error)
    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      });
    }
    const privateKey = req.body.private_key;

    const existingAccount = await UserAccount.query('private_key').eq(privateKey).exec();
    if (existingAccount.count > 0) {
      throw new Error('Account already exists.');
    }

    const newAccount = await UserAccount.create({
      private_key: privateKey,
      ...req.body,
      lessonProgress: [{ lessonId: 'CH1INT1', completed: false }],
      currentLesson: 'CH1INT1',
    });

    res.status(200).json({ id: newAccount.id });
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        errors: formatValidationErrors(error),
      });
    }

    // Check if an account with the given private_key exists
    const account = await UserAccount.query('private_key').eq(req.body.private_key).exec();

    if (account.count === 0) {
      throw new Error('Invalid credentials.');
    }

    const token = await generate(account[0]);
    res
      .cookie(ACCESS_TOKEN_COOKIE_NAME, token, ACCESS_TOKEN_COOKIE_SETTINGS)
      .status(200)
      .json({ id: account[0].id, token: token });
  } catch (err) {
    res.status(500).json({
      errors: [{ message: err.message }],
    });
  }
});

router.post('/logout', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] });
  }

  res
    .clearCookie(ACCESS_TOKEN_COOKIE_NAME, ACCESS_TOKEN_COOKIE_SETTINGS)
    .status(200)
    .json({});
});

router.get('/session', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] });
  }

  res.status(200).json(req.account);
});

export default router;