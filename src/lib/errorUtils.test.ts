import {
  formatErrorMessage,
  extractErrorMessage,
  formatErrorWithFallback,
} from "./errorUtils";

const testCases = [
  {
    input:
      "org.eclipse.angus.mail.smtp.SMTPSendFailedException: 550-5.4.5 Daily user sending limit exceeded. For more information on Gmail 550-5.4.5 sending limits go to 550 5.4.5 https://support.google.com/a/answer/166852 d2e1a72fcca58-771e39cb4b8sm10429491b3a.92-gsmtp",
    expected:
      "Email notification failed: Daily sending limit exceeded. Please try again later.",
  },
  {
    input: "Email already exists in the system",
    expected:
      "Email address is already registered. Please use a different email.",
  },
  {
    input: "Validation failed: firstName is required",
    expected: "Please check your input and try again.",
  },
  {
    input: "Network timeout after 30 seconds",
    expected: "Network error. Please check your connection and try again.",
  },
  {
    input: "Internal server error 500",
    expected: "Server error. Please try again later.",
  },
  {
    input: "Unauthorized access",
    expected: "Authentication error. Please log in again.",
  },
  {
    input: "Forbidden: You don't have permission",
    expected: "You don't have permission to perform this action.",
  },
  {
    input: "Resource not found",
    expected: "The requested resource was not found.",
  },
  {
    input:
      "This is a very long error message that exceeds the maximum length limit and should be truncated to prevent UI clutter and improve user experience",
    expected:
      "This is a very long error message that exceeds the maximum length limit and should be truncated to prevent UI clutter and improve user experience...",
  },
];

export function runErrorFormattingTests() {
let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const result = formatErrorMessage(testCase.input);
    const success = result === testCase.expected;

    if (success) {
      passed++;
} else {
      failed++;


    }
  });


  const errorObject = {
    response: {
      data: {
        message: "Custom error message from backend",
      },
    },
  };

  const extractedMessage = extractErrorMessage(errorObject);


  const fallbackResult = formatErrorWithFallback(null, "Default error message");
return { passed, failed, total: testCases.length };
}

export { testCases };
