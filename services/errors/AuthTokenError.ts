export class AuthTokenError extends Error {
  constructor() {
    super('erro with authentication token')
  }
}