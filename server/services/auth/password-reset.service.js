import * as userRepository from "../../repositories/user/user.repository.js";
import * as passwordResetRepository from "../../repositories/auth/password-reset.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { generateRawToken, hashToken, getExpiryDate } from "../../helpers/auth/password-reset.helper.js";
import { hashPassword } from "../../helpers/password.helper.js";
import { sendEmail } from "../../helpers/email/mailer.helper.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../../constants/messages/auth.message.js";
import env from "../../config/env.js";

// Always returns the same generic outcome whether or not the email exists
// (the caller never learns which) — the only place that varies is whether
// an email actually gets sent underneath.
export async function requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);

    if (user && user.status === 'active') {
        const rawToken = generateRawToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = getExpiryDate();

        await passwordResetRepository.create(user.id, tokenHash, expiresAt);

        const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Reset your School ERP password',
            text: `A password reset was requested for your account. This link expires in 1 hour and can only be used once:\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
            html: `<p>A password reset was requested for your account. This link expires in 1 hour and can only be used once:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`
        });
    }

    return { message: AUTH_MESSAGES.RESET_LINK_SENT };
}

export async function resetPassword(rawToken, newPassword) {
    const tokenHash = hashToken(rawToken);
    const resetToken = await passwordResetRepository.findValidByTokenHash(tokenHash);

    if (!resetToken) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.RESET_TOKEN_INVALID_OR_EXPIRED);
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(resetToken.user_id, { password: hashedPassword });
    await passwordResetRepository.markUsed(resetToken.id);

    await auditRepository.createAuditLog({
        entityType: "User",
        entityId: resetToken.user_id,
        action: "PASSWORD_RESET",
        reason: "Password reset via self-service reset link",
        performedBy: resetToken.user_id
    });

    return { message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
}
