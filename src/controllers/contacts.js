import { getAllContacts, getContactById } from "../services/contacts.js";
import createHttpError from 'http-errors';
import { createContact } from "../services/contacts.js";
import { deleteContact } from "../services/contacts.js";
import { updateContact } from "../services/contacts.js";
import { parsePaginationParams } from "../utils/parsePaginationParams.js";
import { parseSortParams } from "../utils/parseSortParams.js";
import { parseFilterParams } from "../utils/parseFilterParams.js";
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { env } from '../utils/env.js';

export const getContactsController = async (req, res, next) => {
    const { page, perPage } = parsePaginationParams(req.query);
    const { sortBy, sortOrder } = parseSortParams(req.query);
    const filter = { ...parseFilterParams(req.query), userId: req.user._id };

    try {
        const {
            data: contacts,
            totalItems,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        } = await getAllContacts({
            page,
            perPage,
            sortBy,
            sortOrder,
            filter,
        });

        res.status(200).json({
            status: 200,
            message: 'Successfully found contacts!',
            data: contacts,
            page,
            perPage,
            totalItems,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        });
    } catch (err) {
        next(err);
    }
};

export const getContactByIdController = async (req, res) => {
    const { contactId } = req.params;

    const contact = await getContactById(contactId, req.user._id);

    if (!contact) {
        throw createHttpError(404, 'Contact not found!');
    }
    res.status(200).json({
        status: 200,
        message: `Succesfuly found contact with id ${contactId}!`,
        data: contact,
    });
};

export const createContactController = async (req, res) => {
    const {
        name,
        phoneNumber,
        email,
        isFavourite = false,
        contactType,
    } = req.body;
    const userId = req.user._id;
    const photo = req.file;
    let photoUrl;

    if (photo) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
        photoUrl = await saveFileToCloudinary(photo);
    } else {
        photoUrl = await saveFileToUploadDir(photo);
    }
    }

    if (!name || !phoneNumber || !contactType) {
        throw createHttpError(400, 'Name, phoneNumber and contactType are required');
    }

    const contact = await createContact({
        name,
        phoneNumber,
        email,
        isFavourite,
        contactType,
        userId,
        photo: photoUrl,
    });

    res.status(201).json({
        status: 201,
        message: `Successfully created a contact!`,
        data: contact,
    });
};

export const deleteContactController = async (req, res, next) => {
    const { contactId } = req.params;
    const userId = req.user._id;

    const contact = await deleteContact(contactId, userId);

    if (!contact) {
        next(createHttpError(404, 'Contact not found'));
        return;
    }

    res.status(204).send();
};

export const upsertContactController = async (req, res, next) => {
    const { contactId } = req.params;
    const userId = req.user._id;

    const result = await updateContact(contactId, userId, req.body, {
        upsert: true,
    });

    if (!result) {
        next(createHttpError(404, 'Contact not found'));
        return;
    }

    const status = result.isNew ? 201 : 200;

    res.status(status).json({
        status,
        message: 'Successfully upserted a contact',
        data: result.contact,
    });
};

export const patchContactController = async (req, res, next) => {
    const { contactId } = req.params;
    const userId = req.user._id;
    const photo = req.file;
    let photoUrl;

    if (photo) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
        photoUrl = await saveFileToCloudinary(photo);
    } else {
        photoUrl = await saveFileToUploadDir(photo);
    }
    }

    const updatedData = { ...req.body, photo: photoUrl };
    const result = await updateContact(contactId, userId, updatedData);

    if (!result) {
        next(createHttpError(404, 'Contact not found'));
        return;
    }

    res.json({
        status: 200,
        message: 'Successfully patched a contact!',
        data: result.contact,
    });
};
