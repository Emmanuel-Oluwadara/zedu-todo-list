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
    )
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

    setTasks((currentTasks) => [{ id: createTaskId(), text, completed: false }, ...currentTasks])
    setTaskText('')
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
  }

  function clearCompleted() {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed))
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
                  <label className="task-main">
                    <input
                      className="task-checkbox"
                      type="checkbox"
                      checked={task.completed}
                      aria-label={`Mark "${task.text}" as ${task.completed ? 'not complete' : 'complete'}`}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="task-text">{task.text}</span>
                  </label>
                  <button
                    className="delete-button"
                    type="button"
                    aria-label={`Delete "${task.text}"`}
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
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
