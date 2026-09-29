import { useEffect, useRef, useState } from 'react'
import {
  createTodo,
  deleteCompletedTodos,
  deleteTodo,
  fetchTodos,
  updateTodo,
} from './api/todos'
import './App.css'

const FILTERS = ['all', 'active', 'completed']

function App() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [taskText, setTaskText] = useState('')
  const [taskNotes, setTaskNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingNotes, setEditingNotes] = useState('')
  const taskInputRef = useRef(null)

  useEffect(() => {
    let ignoreResult = false

    fetchTodos()
      .then((savedTasks) => {
        if (!ignoreResult) setTasks(savedTasks)
      })
      .catch((error) => {
        if (!ignoreResult) setApiError(error.message)
      })
      .finally(() => {
        if (!ignoreResult) setIsLoading(false)
      })

    return () => {
      ignoreResult = true
    }
  }, [])

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

  async function handleSubmit(event) {
    event.preventDefault()
    const text = taskText.trim()
    if (!text) return

    try {
      const createdTask = await createTodo({ text, notes: taskNotes.trim() })
      setTasks((currentTasks) => [createdTask, ...currentTasks])
      setTaskText('')
      setTaskNotes('')
      setFilter('all')
      setApiError('')
      taskInputRef.current?.focus()
    } catch (error) {
      setApiError(error.message)
    }
  }

  async function toggleTask(task) {
    try {
      const updatedTask = await updateTodo(task.id, {
        text: task.text,
        notes: task.notes,
        completed: !task.completed,
      })
      setTasks((currentTasks) => currentTasks.map((item) => (
        item.id === task.id ? updatedTask : item
      )))
      setApiError('')
    } catch (error) {
      setApiError(error.message)
    }
  }

  async function removeTask(taskId) {
    try {
      await deleteTodo(taskId)
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
      if (editingTaskId === taskId) setEditingTaskId(null)
      setApiError('')
    } catch (error) {
      setApiError(error.message)
    }
  }

  async function clearCompleted() {
    try {
      await deleteCompletedTodos()
      setTasks((currentTasks) => currentTasks.filter((task) => !task.completed))
      setEditingTaskId(null)
      setApiError('')
    } catch (error) {
      setApiError(error.message)
    }
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

  async function saveEdit(event, task) {
    event.preventDefault()
    const text = editingText.trim()
    if (!text) return

    try {
      const updatedTask = await updateTodo(task.id, {
        text,
        notes: editingNotes.trim(),
        completed: task.completed,
      })
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === updatedTask.id ? updatedTask : task
      )))
      setApiError('')
      cancelEditing()
    } catch (error) {
      setApiError(error.message)
    }
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
          {apiError && <p className="api-error" role="alert">{apiError}</p>}
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

          {isLoading ? (
            <div className="empty-state" role="status">
              <p className="empty-title">Loading tasks</p>
              <p className="empty-description">Connecting to your local API.</p>
            </div>
          ) : visibleTasks.length > 0 ? (
            <ul className="todo-list" aria-label="Tasks">
              {visibleTasks.map((task) => (
                <li className={`task-item${task.completed ? ' is-complete' : ''}`} key={task.id}>
                  {editingTaskId === task.id ? (
                    <form className="edit-form" onSubmit={(event) => saveEdit(event, task)}>
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
                          onChange={() => toggleTask(task)}
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
                          onClick={() => removeTask(task.id)}
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
