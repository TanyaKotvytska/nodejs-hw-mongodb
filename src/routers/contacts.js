import { Router } from 'express';
import { getContactsController, getContactByIdController, createContactController, deleteContactController, upsertContactController, patchContactController } from "../controllers/contacts.js";
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { createContactSchema } from '../validation/contacts.js';
import { updateContactSchema } from '../validation/contacts.js';
import { isValidId } from '../middlewares/isValidId.js';
import { authenticate } from '../middlewares/authenticate.js';
import { upload } from '../middlewares/multer.js';

const router = Router();

router.use(authenticate);

router.get('/', ctrlWrapper(getContactsController));

router.get('/:contactId', isValidId, ctrlWrapper(getContactByIdController));

router.post('/', upload.single('photo'), validateBody(createContactSchema), ctrlWrapper(createContactController));

router.delete('/:contactId', isValidId, ctrlWrapper(deleteContactController));

router.put('/:contactId', validateBody(createContactSchema), isValidId, ctrlWrapper(upsertContactController));

router.patch('/:contactId', upload.single('photo'), validateBody(updateContactSchema), isValidId, ctrlWrapper(patchContactController));

export default router;
