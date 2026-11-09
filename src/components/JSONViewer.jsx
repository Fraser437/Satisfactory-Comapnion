import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Copy, X } from 'lucide-react'
import { createPortal } from 'react-dom'

const syntaxHighlight = (json) => {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2)
  }

  return json
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    })
}

const parseJSON = (str) => {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function JSONTree({ data, path = [], isRoot = true, expandedPaths = new Set(), onToggle }) {
  const pathStr = path.join('.')
  const isExpanded = expandedPaths.has(pathStr) || isRoot

  if (data === null) {
    return <span className="json-null">null</span>
  }

  if (typeof data !== 'object') {
    if (typeof data === 'string') {
      return <span className="json-string">"{data}"</span>
    }
    if (typeof data === 'number') {
      return <span className="json-number">{data}</span>
    }
    if (typeof data === 'boolean') {
      return <span className="json-boolean">{data.toString()}</span>
    }
    return <span className="json-null">{String(data)}</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="json-null">[]</span>

    return (
      <div className="ml-4 border-l border-gray-700 pl-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(pathStr)}
            className="p-0.5 text-gray-400 hover:text-white transition-colors"
            aria-label={isExpanded ? 'Collapse array' : 'Expand array'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <span className="json-null">Array[{data.length}]</span>
        </div>
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="json-null text-xs">[{index}]</span>
                <JSONTree
                  data={item}
                  path={path}
                  isRoot={false}
                  expandedPaths={expandedPaths}
                  onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Object
  const keys = Object.keys(data)
  if (keys.length === 0) return <span className="json-null">{}</span>

  return (
    <div className="ml-4 border-l border-gray-700 pl-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(pathStr)}
          className="p-0.5 text-gray-400 hover:text-white transition-colors"
          aria-label={isExpanded ? 'Collapse object' : 'Expand object'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="json-null">Object</span>
      </div>
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {keys.map((key) => (
            <div key={key} className="flex items-start gap-2">
              <span className="json-key">"{key}"</span>
              <span className="json-null">:</span>
              <JSONTree
                data={data[key]}
                path={[...path, key]}
                isRoot={false}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function JSONViewer({ data, onClose }) {
  const [expandedPaths, setExpandedPaths] = useState(new Set(['']))

  const togglePath = (path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const parsedData = useMemo(() => {
    if (typeof data === 'string') return parseJSON(data)
    return data
  }, [data])

  const content = (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close JSON viewer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="json-viewer scrollbar-thin">
        {parsedData ? (
          <JSONTree data={parsedData} expandedPaths={expandedPaths} onToggle={togglePath} />
        ) : (
          <pre className="text-gray-400">{data}</pre>
        )}
      </div>
    </div>
  )

  if (onClose) {
    return createPortal(content, document.body)
  }

  return content
}