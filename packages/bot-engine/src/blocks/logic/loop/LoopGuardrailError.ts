export class LoopGuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoopGuardrailError";
  }
}
