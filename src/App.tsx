import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'simpleTodo_todos'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Todo[]
  } catch (err) {
    console.error('Failed to load todos from localStorage:', err)
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage:', err)
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ─── TodoItem component ───────────────────────────────────────────────────────

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="group flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      {/* Checkbox */}
      <button
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={todo.completed ? `Mark "${todo.text}" as incomplete` : `Mark "${todo.text}" as complete`}
        onClick={() => onToggle(todo.id)}
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-150 cursor-pointer
          ${todo.completed
            ? 'bg-[#4F86F7] border-[#4F86F7]'
            : 'border-gray-300 hover:border-[#4F86F7]'
          }
        `}
      >
        {todo.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Text */}
      <span
        className={`flex-1 text-sm leading-relaxed transition-colors duration-150 ${
          todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
        }`}
      >
        {todo.text}
      </span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.text}"`}
        className="
          flex-shrink-0 p-1 rounded text-gray-300
          opacity-0 group-hover:opacity-100
          hover:text-red-500 hover:bg-red-50
          transition-all duration-150
          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-300
        "
      >
        <TrashIcon />
      </button>
    </li>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  // Persist whenever todos change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // ── Mutations ────────────────────────────────────────────────────────────────

  const addTodo = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [newTodo, ...prev])
    setInputValue('')
  }, [inputValue])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  // ── Derived state ────────────────────────────────────────────────────────────

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-16 pb-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center text-[#4F86F7] mb-8 tracking-tight drop-shadow-sm">
          SimpleTodo
        </h1>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Input area */}
          <div className="flex gap-2 p-4 border-b border-gray-100">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              aria-label="New todo input"
              className="
                flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700
                placeholder-gray-400 outline-none
                focus:border-[#4F86F7] focus:ring-2 focus:ring-[#4F86F7]/20
                transition-all duration-150
              "
            />
            <button
              onClick={addTodo}
              aria-label="Add todo"
              className="
                flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                bg-[#4F86F7] text-white text-sm font-medium
                hover:bg-[#3a74e8] active:bg-[#2f65d8]
                focus:outline-none focus:ring-2 focus:ring-[#4F86F7]/50
                transition-all duration-150 shadow-sm
              "
            >
              <PlusIcon />
              Add
            </button>
          </div>

          {/* Todo list */}
          {filteredTodos.length > 0 ? (
            <ul aria-label="Todo list">
              {filteredTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </ul>
          ) : (
            <div className="py-16 text-center" aria-label="Empty state">
              <p className="text-gray-400 text-sm">
                {todos.length === 0
                  ? 'No todos yet — add one above!'
                  : filter === 'active'
                  ? 'No active todos!'
                  : 'No completed todos yet!'}
              </p>
            </div>
          )}

          {/* Footer */}
          {todos.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              {/* Filter tabs */}
              <div className="flex items-center justify-center gap-1 mb-3">
                {(['all', 'active', 'completed'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150
                      ${filter === f
                        ? 'bg-[#4F86F7] text-white shadow-sm'
                        : 'text-gray-500 hover:text-[#4F86F7] hover:bg-[#4F86F7]/10'
                      }
                    `}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400" aria-live="polite" aria-label="Active todo count">
                  {activeCount} {activeCount === 1 ? 'item' : 'items'} left
                </span>
                {completedCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="
                      text-xs text-gray-400 hover:text-red-500
                      transition-colors duration-150
                      focus:outline-none focus:underline
                    "
                  >
                    Clear Completed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
