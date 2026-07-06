interface DatabaseError {
  code?: string;
}

export function actionError(
  error: DatabaseError | null,
  fallback: string,
  messages: Partial<Record<string, string>> = {},
) {
  if (!error) return fallback;
  return messages[error.code ?? ""] ?? fallback;
}
