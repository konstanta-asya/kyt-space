const API_URL = 'http://localhost:8000'
async function getData(path, signal) { 
    const response = await fetch(API_URL +  path, { signal })

    if (!response.ok) {
         throw new Error(
            'Не вдалося завантажити дані: ' + response.status
         )
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

async function authRequest(path, options = {}) { const response = await fetch(API_URL + path, options) 
    const data = await response.json()
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