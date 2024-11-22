import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import UserCollection from "../db/models/user.js";
import createHttpError from 'http-errors';
import { SMTP, TEMPLATES_DIR } from '../constants/index.js';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendMail.js';
import { randomBytes } from 'crypto';

import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/index.js';
import { SessionsCollection } from '../db/models/session.js';

export const registerUser = async (payload) => {
    const user = await UserCollection.findOne({ email: payload.email });
    if (user) throw createHttpError(409, 'Email in use');

    const encryptedPassword = await bcrypt.hash(payload.password, 10);
    return await UserCollection.create({
        ...payload,
        password: encryptedPassword,
    });
};

export const loginUser = async (payload) => {
    const user = await UserCollection.findOne({ email: payload.email });
    if (!user) {
        throw createHttpError(404, 'User not found');
    }
    const isEqual = await bcrypt.compare(payload.password, user.password);
    if (!isEqual) {
        throw createHttpError(401, 'Unauthorized');
    }

    await SessionsCollection.deleteOne({ userId: user._id });

    const accessToken = randomBytes(30).toString('base64');
    const refreshToken = randomBytes(30).toString('base64');

    return await SessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
    });
};

export const logoutUser = async (sessionId) => {
    await SessionsCollection.deleteOne({ _id: sessionId });
};

const createSession = () => {
    const accessToken = randomBytes(30).toString('base64');
    const refreshToken = randomBytes(30).toString('base64');

    return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
    };
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
    const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
    });

    if (!session) {
    throw createHttpError(401, 'Session not found');
    }

    const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

    if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
    }

    const newSession = createSession();

    await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });

    return await SessionsCollection.create({
    userId: session.userId,
    ...newSession,
    });
};

export const requestResetToken = async (email) => {
    const user = await UserCollection.findOne({ email });
    if (!user) {
    throw createHttpError(404, 'User not found');
    }

    const resetToken = jwt.sign(
    {
        sub: user._id,
        email,
    },
    env('JWT_SECRET'),
    {
        expiresIn: '15m',
    },
    );

    const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
    );

    const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
    ).toString();

    const template = handlebars.compile(templateSource);
    const html = template({
        name: user.name,
    link: `${env('APP_DOMAIN')}/reset-pwd?token=${resetToken}`,
    });

    await sendEmail({
    from: env(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
    });
};

export const resetPassword = async (payload) => {
    let entries;

    try {
    entries = jwt.verify(payload.token, env('JWT_SECRET'));
    } catch (err) {
    if (err.name === 'TokenExpiredError') throw createHttpError(401, 'Reset token expired. Please request a new one.');
    throw createHttpError(401, 'Invalid token');
    }

    const user = await UserCollection.findOne({
    email: entries.email,
    _id: entries.sub,
    });

    if (!user) {
    throw createHttpError(404, 'User not found');
    }

    const encryptedPassword = await bcrypt.hash(payload.password, 10);

    const updateResult = await UserCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
    );

    console.log('Update result:', updateResult);

    const updatedUser = await UserCollection.findOne({ _id: user._id });

    if (!(await bcrypt.compare(payload.password, updatedUser.password))) {
    throw createHttpError(500, 'Password update failed');
    }
};
