import api from "./api";

export interface NotificationPreferences {
  id: string;
  userId: string;
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyTelegram: boolean;
  emailAddress?: string | null;
  telegramChatId?: string | null;
}

export const notificationPreferencesService = {
  /**
   * Get notification preferences for the current user
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get("/users/me/notification-preferences");
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>,
  ): Promise<{ success: boolean; preferences: NotificationPreferences }> => {
    const response = await api.put(
      "/users/me/notification-preferences",
      preferences,
    );
    return response.data;
  },

  /**
   * Test Telegram notification
   */
  testTelegram: async (
    telegramChatId: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await api.post("/users/me/test-telegram", {
      telegramChatId,
    });
    return response.data;
  },
};
