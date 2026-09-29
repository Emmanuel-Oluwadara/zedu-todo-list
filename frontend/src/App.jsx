import { useEffect, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'daylist.tasks'
const FILTERS = ['all', 'active', 'completed']

function loadTasks() {
  try {
    const savedTasks = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(savedTasks)) return []

    return savedTasks.filter((task) =>
      task &&
      typeof task.id === 'string' &&
      typeof task.text === 'string' &&
      typeof task.completed === 'boolean'
    ).map((task) => ({
      ...task,
      notes: typeof task.notes === 'string' ? task.notes : '',
    }))
  } catch {
    return []
  }
}

function createTaskId() {
  return typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [filter, setFilter] = useState('all')
  const [taskText, setTaskText] = useState('')
  const [taskNotes, setTaskNotes] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingNotes, setEditingNotes] = useState('')
  const taskInputRef = useRef(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // The list remains usable if browser storage is unavailable.
    }
  }, [tasks])

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
  const remainingCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - remainingCount
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  function handleSubmit(event) {
    event.preventDefault()
    const text = taskText.trim()
    if (!text) return

    setTasks((currentTasks) => [{
      id: createTaskId(),
      text,
      notes: taskNotes.trim(),
      completed: false,
    }, ...currentTasks])
    setTaskText('')
    setTaskNotes('')
    setFilter('all')
    taskInputRef.current?.focus()
  }

  function toggleTask(taskId) {
    setTasks((currentTasks) => currentTasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    if (editingTaskId === taskId) setEditingTaskId(null)
  }

  function clearCompleted() {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed))
    setEditingTaskId(null)
  }

  function startEditing(task) {
    setEditingTaskId(task.id)
    setEditingText(task.text)
    setEditingNotes(task.notes)
  }

  function cancelEditing() {
    setEditingTaskId(null)
    setEditingText('')
    setEditingNotes('')
  }

  function saveEdit(event, taskId) {
    event.preventDefault()
    const text = editingText.trim()
    if (!text) return

    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId
        ? { ...task, text, notes: editingNotes.trim() }
        : task
    )))
    cancelEditing()
  }

  const emptyTitle = tasks.length === 0
    ? 'No tasks yet'
    : filter === 'active'
      ? 'No active tasks'
      : 'No completed tasks'
  const emptyDescription = tasks.length === 0
    ? 'Add your first task to start the list.'
    : filter === 'active'
      ? 'Everything on your list is complete.'
      : 'Completed tasks will show up here.'

  return (
    <>
      <header className="site-header">
        <a className="brand" href="./" aria-label="Daylist home">
          <span className="brand-mark" aria-hidden="true" />
          <span>daylist</span>
        </a>
        <p className="date-label">{today}</p>
      </header>

      <main className="app-shell">
        <section className="task-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">PERSONAL LIST</p>
            <h1 id="page-title">Your tasks<span className="heading-period">.</span></h1>
          </div>
          <div className="progress-summary">
            <p className="task-count" aria-live="polite">
              {remainingCount} {remainingCount === 1 ? 'task' : 'tasks'} left
            </p>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Tasks completed"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
            >
              <span className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-label">
              {tasks.length === 0 ? 'Ready when you are' : `${completedCount} of ${tasks.length} complete`}
            </p>
          </div>
        </section>

        <form className="task-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="task-input">Add a task</label>
          <input
            ref={taskInputRef}
            id="task-input"
            name="task"
            type="text"
            placeholder="What needs to get done?"
            maxLength={160}
            autoComplete="off"
            required
            value={taskText}
            onChange={(event) => setTaskText(event.target.value)}
          />
          <label className="sr-only" htmlFor="task-notes">Notes (optional)</label>
          <textarea
            id="task-notes"
            name="notes"
            className="task-notes-input"
            placeholder="Add a note (optional)"
            maxLength={500}
            rows={2}
            value={taskNotes}
            onChange={(event) => setTaskNotes(event.target.value)}
          />
          <button className="add-button" type="submit">
            <span aria-hidden="true">+</span> Add task
          </button>
        </form>

        <section className="task-section" aria-label="Your tasks">
          <div className="list-toolbar">
            <div className="filters" role="group" aria-label="Filter tasks">
              {FILTERS.map((filterName) => (
                <button
                  className="filter-button"
                  key={filterName}
                  type="button"
                  aria-pressed={filter === filterName}
                  onClick={() => setFilter(filterName)}
                >
                  {filterName[0].toUpperCase() + filterName.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="clear-completed"
              type="button"
              disabled={completedCount === 0}
              onClick={clearCompleted}
            >
              Clear completed
            </button>
          </div>

          {visibleTasks.length > 0 ? (
            <ul className="todo-list" aria-label="Tasks">
              {visibleTasks.map((task) => (
                <li className={`task-item${task.completed ? ' is-complete' : ''}`} key={task.id}>
                  {editingTaskId === task.id ? (
                    <form className="edit-form" onSubmit={(event) => saveEdit(event, task.id)}>
                      <label className="edit-field">
                        Task
                        <input
                          type="text"
                          maxLength={160}
                          required
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                        />
                      </label>
                      <label className="edit-field">
                        Notes (optional)
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={editingNotes}
                          onChange={(event) => setEditingNotes(event.target.value)}
                        />
                      </label>
                      <div className="edit-actions">
                        <button className="save-edit-button" type="submit">Save</button>
                        <button className="cancel-edit-button" type="button" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="task-content">
                      <label className="task-main">
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked={task.completed}
                          aria-label={`Mark "${task.text}" as ${task.completed ? 'not complete' : 'complete'}`}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span className="task-copy">
                          <span className="task-text">{task.text}</span>
                          {task.notes && <span className="task-note">{task.notes}</span>}
                        </span>
                      </label>
                      <div className="task-actions">
                        <button
                          className="edit-button"
                          type="button"
                          aria-label={`Edit "${task.text}"`}
                          onClick={() => startEditing(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          type="button"
                          aria-label={`Delete "${task.text}"`}
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state" role="status">
              <p className="empty-title">{emptyTitle}</p>
              <p className="empty-description">{emptyDescription}</p>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>DAYLIST</span>
          <span>Saved on this device</span>
        </footer>
      </main>
    </>
  )
}

export default App
