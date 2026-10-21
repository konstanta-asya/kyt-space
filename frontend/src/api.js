const API_URL = 'http://localhost:8000'

// fetch кидає TypeError ("Failed to fetch"), коли сервер недоступний,
// тому підміняємо його зрозумілим повідомленням
async function request(url, options) {
  try {
    return await fetch(url, options)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Немає з’єднання з сервером. Спробуйте пізніше.', { cause: err })
  }
}
async function getData(path, signal) { 
    const response = await request(API_URL + path, { signal })

    if (!response.ok) {
         const error = new Error(
            response.status === 404
              ? 'Нічого не знайдено.'
              : 'Не вдалося завантажити дані: ' + response.status
         )
         error.status = response.status
         throw error
    }
return response.json() 
}
export function getRooms(signal) { 
    return getData('/rooms', signal) 
}
export function getEquipment(signal) { 
    return getData('/equipment', signal) 
}

export function getRoom(id, signal) {
  return getData('/rooms/' + id, signal)
}

export function getRoomEquipment(id, signal) {
  return getData('/rooms/' + id + '/equipment', signal)
}

async function authRequest(path, options = {}) { const response = await request(API_URL + path, options)
    // при 5xx сервер може повернути не JSON
    const data = await response.json().catch(() => ({}))
if (!response.ok) { let message = 'Не вдалося виконати запит'
    if (typeof data.detail === 'string') {
  message = data.detail
} else if (Array.isArray(data.detail)) {
  message = data.detail.map((item) => item.msg).join('. ')
}

const error = new Error(message)
error.status = response.status
throw error
}
return data }
export function registerUser(userData) { return authRequest('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(userData), }) }
export function loginUser(email, password) { return authRequest('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ email, password }), }) }
export function getCurrentUser(token, signal) { return authRequest('/auth/me', { headers: { Authorization: 'Bearer ' + token, }, signal, }) }