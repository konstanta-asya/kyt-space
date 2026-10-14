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