import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { NotFoundError, UnauthorizedError, AppError, ForbiddenError } from '../middleware/errorHandler';

export interface UnlockPayload {
  vaultPin?: string;
  vaultPassword?: string;
}

export interface UpdateVaultSettingsPayload {
  vaultPin?: string;
  vaultPassword?: string;
  currentPinOrPassword?: string;
  autoLockTimeout?: number;
  lockOnAppClose?: boolean;
  lockOnInactivity?: boolean;
}

class VaultService {
  async getVaultSettings(userId: string) {
    const settings = await prisma.vaultSettings.findUnique({
      where: { userId },
    });

    return {
      hasPinSet: !!settings?.vaultPin,
      hasPasswordSet: !!settings?.vaultPassword,
      autoLockTimeout: settings?.autoLockTimeout ?? 1800,
      lockOnAppClose: settings?.lockOnAppClose ?? true,
      lockOnInactivity: settings?.lockOnInactivity ?? true,
    };
  }

  async updateVaultSettings(userId: string, data: UpdateVaultSettingsPayload) {
    const existing = await prisma.vaultSettings.findUnique({
      where: { userId },
    });

    // If changing existing PIN/Password, verify current authentication
    if (existing?.vaultPin && (data.vaultPin || data.vaultPassword)) {
      if (!data.currentPinOrPassword) {
        throw new AppError('Current PIN or password is required to change vault credentials', 400);
      }

      let isCurrentValid = false;
      if (existing.vaultPin) {
        isCurrentValid = await bcrypt.compare(data.currentPinOrPassword, existing.vaultPin);
      }
      if (!isCurrentValid && existing.vaultPassword) {
        isCurrentValid = await bcrypt.compare(data.currentPinOrPassword, existing.vaultPassword);
      }

      if (!isCurrentValid) {
        throw new UnauthorizedError('Current PIN or password is incorrect');
      }
    }

    const updateData: any = {};

    if (data.vaultPin) {
      const pinStr = String(data.vaultPin).trim();
      if (!/^\d{6}$/.test(pinStr)) {
        throw new AppError('Vault PIN must be exactly 6 digits', 400);
      }
      updateData.vaultPin = await bcrypt.hash(pinStr, 12);
    }

    if (data.vaultPassword !== undefined) {
      if (data.vaultPassword) {
        if (data.vaultPassword.length < 8) {
          throw new AppError('Vault backup password must be at least 8 characters', 400);
        }
        updateData.vaultPassword = await bcrypt.hash(data.vaultPassword, 12);
      } else {
        updateData.vaultPassword = null;
      }
    }

    if (data.autoLockTimeout !== undefined) {
      const timeout = Number(data.autoLockTimeout);
      if (isNaN(timeout) || timeout < 60 || timeout > 86400) {
        throw new AppError('Auto-lock timeout must be between 60 seconds and 24 hours', 400);
      }
      updateData.autoLockTimeout = timeout;
    }

    if (data.lockOnAppClose !== undefined) {
      updateData.lockOnAppClose = Boolean(data.lockOnAppClose);
    }

    if (data.lockOnInactivity !== undefined) {
      updateData.lockOnInactivity = Boolean(data.lockOnInactivity);
    }

    // If initial setup, require vaultPin
    if (!existing && !data.vaultPin) {
      throw new AppError('Vault PIN is required to set up your vault', 400);
    }

    const updated = await prisma.vaultSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        vaultPin: updateData.vaultPin,
        vaultPassword: updateData.vaultPassword || null,
        autoLockTimeout: updateData.autoLockTimeout ?? 1800,
        lockOnAppClose: updateData.lockOnAppClose ?? true,
        lockOnInactivity: updateData.lockOnInactivity ?? true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'vault_settings_update',
        resourceType: 'vault',
        resourceId: updated.id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    return {
      success: true,
      message: 'Vault settings updated successfully',
      hasPinSet: !!updated.vaultPin,
      hasPasswordSet: !!updated.vaultPassword,
      autoLockTimeout: updated.autoLockTimeout,
      lockOnAppClose: updated.lockOnAppClose,
      lockOnInactivity: updated.lockOnInactivity,
    };
  }

  async unlockVault(
    userId: string,
    data: UnlockPayload,
    ipAddress?: string,
    userAgent?: string
  ) {
    const settings = await prisma.vaultSettings.findUnique({
      where: { userId },
    });

    if (!settings || !settings.vaultPin) {
      throw new AppError('Vault PIN has not been set up yet. Please set up your vault first.', 404);
    }

    const { vaultPin, vaultPassword } = data;
    if (!vaultPin && !vaultPassword) {
      throw new AppError('PIN or backup password is required to unlock', 400);
    }

    let isValid = false;
    let method = 'pin';

    if (vaultPin) {
      method = 'pin';
      isValid = await bcrypt.compare(String(vaultPin).trim(), settings.vaultPin);
    } else if (vaultPassword && settings.vaultPassword) {
      method = 'password';
      isValid = await bcrypt.compare(vaultPassword, settings.vaultPassword);
    }

    // Log attempt in VaultAccessLog
    await prisma.vaultAccessLog.create({
      data: {
        userId,
        method,
        success: isValid,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    if (!isValid) {
      throw new UnauthorizedError('Incorrect PIN or password');
    }

    const timeout = settings.autoLockTimeout || 1800;
    const expiresAtDate = new Date(Date.now() + timeout * 1000);

    const vaultToken = jwt.sign(
      { userId, type: 'vault_unlock' },
      env.JWT_SECRET,
      { expiresIn: `${timeout}s` }
    );

    return {
      success: true,
      message: 'Vault unlocked successfully',
      vaultToken,
      expiresAt: expiresAtDate.toISOString(),
      remainingSeconds: timeout,
    };
  }

  async lockVault(userId: string) {
    const latestLog = await prisma.vaultAccessLog.findFirst({
      where: { userId, lockedAt: null, success: true },
      orderBy: { unlockedAt: 'desc' },
    });

    if (latestLog) {
      await prisma.vaultAccessLog.update({
        where: { id: latestLog.id },
        data: { lockedAt: new Date() },
      });
    }

    return {
      success: true,
      message: 'Vault locked successfully',
    };
  }

  async extendSession(userId: string, currentVaultToken?: string) {
    if (!currentVaultToken) {
      throw new ForbiddenError('Vault is not unlocked');
    }

    try {
      const decoded = jwt.verify(currentVaultToken, env.JWT_SECRET) as {
        userId: string;
        type: string;
      };

      if (decoded.userId !== userId || decoded.type !== 'vault_unlock') {
        throw new ForbiddenError('Invalid vault unlock token');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        throw err;
      }
      throw new ForbiddenError('Vault session has expired. Unlock again.');
    }

    const settings = await prisma.vaultSettings.findUnique({
      where: { userId },
    });

    const timeout = settings?.autoLockTimeout || 1800;
    const expiresAtDate = new Date(Date.now() + timeout * 1000);

    const newVaultToken = jwt.sign(
      { userId, type: 'vault_unlock' },
      env.JWT_SECRET,
      { expiresIn: `${timeout}s` }
    );

    return {
      success: true,
      message: 'Vault session extended',
      vaultToken: newVaultToken,
      expiresAt: expiresAtDate.toISOString(),
      remainingSeconds: timeout,
    };
  }

  async getVaultStatus(userId: string, vaultToken?: string) {
    const settings = await prisma.vaultSettings.findUnique({
      where: { userId },
    });

    const hasPinSet = !!settings?.vaultPin;
    const autoLockTimeout = settings?.autoLockTimeout ?? 1800;

    if (!vaultToken) {
      return {
        isUnlocked: false,
        hasPinSet,
        remainingSeconds: 0,
        expiresAt: null,
        autoLockTimeout,
      };
    }

    try {
      const decoded = jwt.verify(vaultToken, env.JWT_SECRET) as {
        userId: string;
        type: string;
        exp?: number;
      };

      if (decoded.userId !== userId || decoded.type !== 'vault_unlock') {
        return {
          isUnlocked: false,
          hasPinSet,
          remainingSeconds: 0,
          expiresAt: null,
          autoLockTimeout,
        };
      }

      const exp = (decoded.exp || 0) * 1000;
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((exp - now) / 1000));

      if (remainingSeconds <= 0) {
        return {
          isUnlocked: false,
          hasPinSet,
          remainingSeconds: 0,
          expiresAt: null,
          autoLockTimeout,
        };
      }

      return {
        isUnlocked: true,
        hasPinSet,
        remainingSeconds,
        expiresAt: new Date(exp).toISOString(),
        autoLockTimeout,
      };
    } catch {
      return {
        isUnlocked: false,
        hasPinSet,
        remainingSeconds: 0,
        expiresAt: null,
        autoLockTimeout,
      };
    }
  }
}

export default new VaultService();
