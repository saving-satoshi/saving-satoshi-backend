import { Router } from 'express';
import { RequestWithToken } from 'types';
import { authenticated } from 'middleware';

const router = Router();

router.post('/', authenticated, async (req: RequestWithToken, res) => {
  if (!req.account) {
    return res.status(403).json({ errors: [{ message: 'Forbidden.' }] });
  }

});

export default router;
