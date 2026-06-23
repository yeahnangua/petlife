export function success(data = {}) {
  return {
    code: 0,
    message: 'ok',
    data
  }
}

export function failure(code, message, data = null) {
  return {
    code,
    message,
    data
  }
}
