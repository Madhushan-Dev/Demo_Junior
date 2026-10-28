export async function getUserEmailPreferences(userId: string) {
return {
    status: "success",
    data: {
      defectCreated: true,
      defectUpdated: true,
      defectClosed: true,
    },
  };
}

export async function updateUserEmailPreferences(
  userId: string,
  preferences: any,
) {
return {
    status: "success",
    message: "Preferences updated successfully (Mocked)",
  };
}
