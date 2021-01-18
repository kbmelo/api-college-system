import { Router } from 'express';

import disciplineController from '@controllers/disciplineController';

const router = Router();

router.route('/')
  .get(disciplineController.list)
  .post(disciplineController.create);
router.route('/:id')
  .get(disciplineController.detail)
  .patch(disciplineController.update)
  .delete(disciplineController.delete);

export default router;