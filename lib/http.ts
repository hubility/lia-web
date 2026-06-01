export function jsonOk(data: unknown, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function withApiErrors(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof Response) return error;
    // Errores con `status` numérico (BookingError, validación) → ese código.
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
    ) {
      const e = error as { status: number; message?: string };
      return jsonError(e.status, e.message ?? "Erro");
    }
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonError(500, message);
  }
}
