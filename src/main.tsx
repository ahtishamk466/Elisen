import React from 'react'
import ReactDOM from 'react-dom/client'
import { loadCore } from '@/lib/dataset'
import '@/styles/globals.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

/**
 * The client's records load before the app is imported, not after.
 *
 * Every store seeds itself from `coreData()` the moment its module is
 * evaluated, so the app has to be pulled in *dynamically* — a static import
 * would be hoisted above this await and the stores would seed from empty
 * arrays. Loading first also means no screen ever renders an empty state it
 * would immediately have to replace.
 */
async function start() {
  try {
    await loadCore()
  } catch (err) {
    root.render(
      <div style={{ font: '16px/1.6 system-ui, sans-serif', margin: '15vh auto', maxWidth: 480, padding: '0 24px', color: '#020617' }}>
        <h1 style={{ fontSize: 20 }}>We couldn&rsquo;t load the data</h1>
        <p style={{ color: '#334155' }}>
          Refresh the page, and if it keeps happening, contact your administrator.
        </p>
        <p style={{ color: '#64748B', fontSize: 13 }}>{String(err)}</p>
      </div>,
    )
    return
  }

  const { default: App } = await import('@/app/App')
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void start()
