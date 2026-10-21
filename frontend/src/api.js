const API_URL = 'http://localhost:8000'
const TOKEN_KEY = 'access_token'

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

// Єдина обгортка над fetch: додає токен, серіалізує body в JSON
// і перетворює відповідь з помилкою на Error з полем status
async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    // fetch кидає TypeError ("Failed to fetch"), коли сервер недоступний,
    // тому підміняємо його зрозумілим повідомленням
    if (err.name === 'AbortError') throw err
    throw new Error('Немає з’єднання з сервером. Спробуйте пізніше.', { cause: err })
  }

  // при 5xx сервер може повернути не JSON
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    let message = 'Не вдалося виконати запит: ' + response.status
    if (typeof data.detail === 'string') {
      message = data.detail
    } else if (Array.isArray(data.detail)) {
      message = data.detail.map((item) => item.msg).join('. ')
    }

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

export function getRooms(signal) {
  return request('/rooms', { signal })
}

export function getEquipment(signal) {
  return request('/equipment', { signal })
}

export function getRoom(id, signal) {
  return request('/rooms/' + id, { signal })
}

export function getRoomEquipment(id, signal) {
  return request('/rooms/' + id + '/equipment', { signal })
}

export function registerUser(userData) {
  return request('/auth/register', { method: 'POST', body: userData })
}

export function loginUser(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password } })
}

export function getCurrentUser(signal) {
  return request('/auth/me', { signal })
}
