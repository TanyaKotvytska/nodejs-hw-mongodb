import { getAllContacts, getContactById } from "../services/contacts.js";
import createHttpError from 'http-errors';
import { createContact } from "../services/contacts.js";
import { deleteContact } from "../services/contacts.js";
import { updateContact } from "../services/contacts.js";
import { parsePaginationParams } from "../utils/parsePaginationParams.js";
import { parseSortParams } from "../utils/parseSortParams.js";
import { parseFilterParams } from "../utils/parseFilterParams.js";

export const getContactsController = async (req, res, next) => {
    const { page, perPage } = parsePaginationParams(req.query);
    const { sortBy, sortOrder } = parseSortParams(req.query);
    const filter = parseFilterParams(req.query);

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

export const getContactByIdController = async (req, res, next) => {
    const { contactId } = req.params;
    const contact = await getContactById(contactId);

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

    if (!name || !phoneNumber || !contactType) {
        throw createHttpError(400, 'Name, phoneNumber and contactType are required');
    }

    const contact = await createContact({name,
        phoneNumber,
        email,
        isFavourite,
        contactType,});

    res.status(201).json({
        status: 201,
        message: `Successfully created a contact!`,
        data: contact,
    });
};

export const deleteContactController = async (req, res, next) => {
    const { contactId } = req.params;

    const contact = await deleteContact(contactId);

    if (!contact) {
        next(createHttpError(404, 'Contact not found'));
        return;
    }

    res.status(204).send();
};

export const upsertContactController = async (req, res, next) => {
    const { contactId } = req.params;

    const result = await updateContact(contactId, req.body, {
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
    const result = await updateContact(contactId, req.body);

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
