const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Set VITE_API_BASE_URL in frontend/.env and restart Vite.')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error(`Could not connect to ${API_BASE_URL}. Check that the FastAPI server is running.`)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const detail = Array.isArray(payload?.detail)
      ? payload.detail.map((issue) => issue.msg).join(', ')
      : payload?.detail
    throw new Error(detail || `The API request failed (${response.status}).`)
  }

  if (response.status === 204) return null
  return response.json()
}

export function fetchTodos() {
  return request('/api/todos')
}

export function createTodo(todo) {
  return request('/api/todos', {
    method: 'POST',
    body: JSON.stringify(todo),
  })
}

export function updateTodo(id, changes) {
  return request(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function deleteTodo(id) {
  return request(`/api/todos/${id}`, { method: 'DELETE' })
}

export function deleteCompletedTodos() {
  return request('/api/todos/completed', { method: 'DELETE' })
}