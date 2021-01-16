import { Router } from 'express';

import userController from '@controllers/userController';

const router = Router();

router.route('/').get(userController.list);

export default router;
