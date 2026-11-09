import { useState, useEffect } from 'react'
import { Plus, Trash2, Trash, RotateCcw, CheckSquare, Square, Loader2, Download, Upload, Filter, X } from 'lucide-react'
import { useTelemetryStore } from '../store/useTelemetryStore'

export function TodoTab() {
  const {
    shoppingList,
    customTasks,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearShoppingList,
    addCustomTask,
    toggleCustomTask,
    updateCustomTask,
    removeCustomTask,
    clearCompletedTasks,
    getShoppingProgress,
    getCustomTasksProgress,
    exportPlannerToShoppingList,
  } = useTelemetryStore()

  const [newTaskText, setNewTaskText] = useState('')
  const [newShoppingItem, setNewShoppingItem] = useState({ name: '', count: 1, unit: 'pcs' })
  const [shoppingFilter, setShoppingFilter] = useState('all')
  const [taskFilter, setTaskFilter] = useState('all')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTaskText, setEditingTaskText] = useState('')

  const shoppingProgress = getShoppingProgress()
  const tasksProgress = getCustomTasksProgress()

  const filteredShopping = shoppingList.filter(item => {
    if (shoppingFilter === 'active') return !item.completed
    if (shoppingFilter === 'completed') return item.completed
    return true
  })

  const filteredTasks = customTasks.filter(task => {
    if (taskFilter === 'active') return !task.completed
    if (taskFilter === 'completed') return task.completed
    return true
  })

  const handleAddShoppingItem = (e) => {
    e.preventDefault()
    if (!newShoppingItem.name.trim()) return
    addShoppingItem({
      name: newShoppingItem.name.trim(),
      count: newShoppingItem.count,
      unit: newShoppingItem.unit,
      type: 'manual',
    })
    setNewShoppingItem({ name: '', count: 1, unit: 'pcs' })
  }

  const handleAddCustomTask = (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    addCustomTask({ text: newTaskText.trim() })
    setNewTaskText('')
  }

  const handleEditTask = (task) => {
    setEditingTaskId(task.id)
    setEditingTaskText(task.text)
  }

  const handleSaveEdit = (id) => {
    if (editingTaskText.trim()) {
      updateCustomTask(id, { text: editingTaskText.trim() })
    }
    setEditingTaskId(null)
    setEditingTaskText('')
  }

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') handleSaveEdit(id)
    if (e.key === 'Escape') {
      setEditingTaskId(null)
      setEditingTaskText('')
    }
  }

  const exportData = () => {
    const data = {
      shoppingList,
      customTasks,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `satisfactory-todo-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.shoppingList) {
          // Note: In a real app, you'd merge or replace. For now just log.
          console.log('Imported shopping list:', data.shoppingList)
        }
        if (data.customTasks) {
          console.log('Imported tasks:', data.customTasks)
        }
        alert('Import successful! Check console for data.')
      } catch (err) {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="tab-panel p-6 space-y-6 overflow-y-auto">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">To-Do & Materials</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportData} className="btn-secondary" title="Export data">
            <Download className="w-4 h-4" />
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shopping List Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Building Shopping List
            </h3>
            <span className="text-sm font-mono text-emerald-400">{shoppingProgress}%</span>
          </div>
          <div className="progress-bar mb-3">
            <div
              className="progress-fill"
              style={{ width: `${shoppingProgress}%` }}
              role="progressbar"
              aria-valuenow={shoppingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{shoppingList.filter(i => !i.completed).length} remaining</span>
            <span>{shoppingList.filter(i => i.completed).length} completed</span>
          </div>
        </div>

        {/* Custom Tasks Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Square className="w-5 h-5 text-blue-400" />
              Custom Tasks
            </h3>
            <span className="text-sm font-mono text-blue-400">{tasksProgress}%</span>
          </div>
          <div className="progress-bar mb-3">
            <div
              className="progress-fill bg-blue-500"
              style={{ width: `${tasksProgress}%` }}
              role="progressbar"
              aria-valuenow={tasksProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{customTasks.filter(t => !t.completed).length} remaining</span>
            <span>{customTasks.filter(t => t.completed).length} completed</span>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shopping List Column */}
        <div className="card flex flex-col h-[500px]">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-medium text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Building Shopping List
              <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">{shoppingList.length}</span>
            </h3>
            <div className="flex items-center gap-1">
              <select
                value={shoppingFilter}
                onChange={(e) => setShoppingFilter(e.target.value)}
                className="select-field text-xs py-1 px-2 w-auto"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              {shoppingList.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all shopping list items?')) clearShoppingList()
                  }}
                  className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  title="Clear all"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Add Shopping Item Form */}
          <form onSubmit={handleAddShoppingItem} className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Item name (e.g., Iron Plate)"
                value={newShoppingItem.name}
                onChange={(e) => setNewShoppingItem(prev => ({ ...prev, name: e.target.value }))}
                className="input-field sm:col-span-2"
              />
              <input
                type="number"
                placeholder="Count"
                value={newShoppingItem.count}
                onChange={(e) => setNewShoppingItem(prev => ({ ...prev, count: Number(e.target.value) || 1 }))}
                className="input-field"
                min="1"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={newShoppingItem.unit}
                onChange={(e) => setNewShoppingItem(prev => ({ ...prev, unit: e.target.value }))}
                className="select-field text-sm w-32"
              >
                <option value="pcs">pcs</option>
                <option value="stacks">stacks</option>
                <option value="m">meters</option>
                <option value="MW">MW</option>
              </select>
              <button type="submit" className="btn-primary text-sm flex-1">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
          </form>

          {/* Shopping List Items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
            {filteredShopping.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                <CheckSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No shopping items</p>
                <p className="text-xs text-gray-600">Add items manually or export from Planner</p>
              </div>
            ) : (
              filteredShopping.map(item => (
                <div
                  key={item.id}
                  className={`todo-item ${item.completed ? 'completed' : ''} flex items-center gap-3`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleShoppingItem(item.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`todo-text font-medium text-white truncate ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="font-mono text-emerald-300">{item.count} {item.unit}</span>
                      {item.type && <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] uppercase">{item.type}</span>}
                      {item.recipe && <span className="text-[10px]">Recipe: {item.recipe}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeShoppingItem(item.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Tasks Column */}
        <div className="card flex flex-col h-[500px]">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Square className="w-5 h-5 text-blue-400" />
              Custom Tasks
              <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">{customTasks.length}</span>
            </h3>
            <div className="flex items-center gap-1">
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="select-field text-xs py-1 px-2 w-auto"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              {(customTasks.some(t => t.completed) || shoppingList.some(i => i.completed)) && (
                <button
                  onClick={() => clearCompletedTasks()}
                  className="btn-secondary text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Clear Done
                </button>
              )}
            </div>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddCustomTask} className="p-4 border-b border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a custom task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                <Square className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No custom tasks</p>
                <p className="text-xs text-gray-600">Add your own tasks above</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`todo-item ${task.completed ? 'completed' : ''} flex items-center gap-3 group relative`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleCustomTask(task.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  {editingTaskId === task.id ? (
                    <>
                      <input
                        type="text"
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, task.id)}
                        autoFocus
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-green-400 hover:bg-green-900/20"
                        title="Save"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingTaskId(null); setEditingTaskText('') }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p
                        className={`todo-text flex-1 cursor-pointer ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}
                        onDoubleClick={() => handleEditTask(task)}
                      >
                        {task.text}
                      </p>
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeCustomTask(task.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-yellow-400" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportPlannerToShoppingList}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Import from Planner
          </button>
          <button
            onClick={() => clearCompletedTasks()}
            disabled={!customTasks.some(t => t.completed) && !shoppingList.some(i => i.completed)}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Completed
          </button>
          <button
            onClick={exportData}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All Data
          </button>
        </div>
      </div>
    </div>
  )
}