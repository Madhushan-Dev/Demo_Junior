export function getProjectCardColor(
  projectId: string,
  risk?: "high" | "medium" | "low",
) {
switch (risk) {
    case "high":
      return "bg-gradient-to-br from-red-500 via-red-600 to-red-700";
    case "medium":
      return "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600";
    case "low":
      return "bg-gradient-to-br from-green-400 via-green-500 to-green-600";
    default:
      return "bg-gradient-to-br from-green-400 via-green-500 to-green-600";
  }
}
