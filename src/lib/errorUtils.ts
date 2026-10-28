export const formatErrorMessage = (errorMessage: string): string => {
  if (!errorMessage) return "An error occurred";

  const lowerMessage = errorMessage.toLowerCase();

  if (
      lowerMessage.includes("request failed with status code") ||
      lowerMessage.includes("status code 400")
  ) {
    return "Please check your input and try again.";
  }

  if (
      lowerMessage.includes("daily user sending limit exceeded") ||
      lowerMessage.includes("smtpsendfailedexception") ||
      lowerMessage.includes("550-5.4.5")
  ) {
    return "Email notification failed: Daily sending limit exceeded. Please try again later.";
  }

  if (
      lowerMessage.includes("email") &&
      lowerMessage.includes("already exists")
  ) {
    return "Email address is already registered. Please use a different email.";
  }

  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "Please check your input and try again.";
  }

  if (
      lowerMessage.includes("network") ||
      lowerMessage.includes("connection") ||
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("fetch")
  ) {
    return "Network error. Please check your connection and try again.";
  }

  if (
      lowerMessage.includes("500") ||
      lowerMessage.includes("internal server error")
  ) {
    return "Server error. Please try again later.";
  }

  if (lowerMessage.includes("unauthorized") || lowerMessage.includes("401")) {
    return "Authentication error. Please log in again.";
  }

  if (lowerMessage.includes("forbidden") || lowerMessage.includes("403")) {
    return "You don't have permission to perform this action.";
  }

  if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
    return "The requested resource was not found.";
  }

  if (lowerMessage.includes("failed") || lowerMessage.includes("error")) {
    const mainPart = errorMessage
        .split("\n")[0]
        .split("550")[0]
        .split("org.")[0];
    if (mainPart.length > 0 && mainPart.length < 100) {
      return mainPart.trim();
    }
  }

  if (errorMessage.length > 100) {
    const truncated = errorMessage.substring(0, 100).trim();
    return truncated + (truncated.endsWith(".") ? "" : "...");
  }

  return errorMessage;
};

export const extractErrorMessage = (error: any): string => {
  if (!error) return "An error occurred";

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    return error
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.message) return item.message;
          if (item?.error) return item.error;
          if (item?.errorMessage) return item.errorMessage;
          return "";
        })
        .filter(Boolean)
        .join(", ");
  }

  // Extracts error message from Spring Boot ResponseWrapper data list
  if (error.response?.data?.data?.[0]?.errorMessage) {
    return error.response.data.data[0].errorMessage;
  }

  const responseData = error.response?.data;

  if (responseData) {
    if (typeof responseData === "string") return responseData;

    if (responseData.message) return responseData.message;
    if (responseData.error) return responseData.error;
    if (responseData.statusMessage) return responseData.statusMessage;
    if (Array.isArray(responseData.errors)) {
      return responseData.errors.join(", ");
    }
    if (responseData.data) {
      if (typeof responseData.data === "string") return responseData.data;
      if (responseData.data.message) return responseData.data.message;
      if (Array.isArray(responseData.data)) {
        return responseData.data
            .map((item: any) =>
                typeof item === "string"
                    ? item
                    : item?.errorMessage || item?.message || item?.error,
            )
            .filter(Boolean)
            .join(", ");
      }
    }
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return error.error;
  }

  return "An unexpected error occurred";
};

export const formatErrorWithFallback = (
    error: any,
    fallbackMessage: string,
): string => {
  const errorMessage = extractErrorMessage(error);
  return formatErrorMessage(errorMessage || fallbackMessage);
};
