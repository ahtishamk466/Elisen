import { forwardRef, useImperativeHandle, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type TableHTMLAttributes } from 'react'
import { useFrozenTableLayout } from './useFrozenTableLayout'
import { useSyncedScroll } from './useSyncedScroll'

export interface FrozenTableProps {
  columns: readonly (number | string)[]
  /** The one actual interactive <thead>, including its <tr> elements. */
  header: ReactNode
  /** Existing <tbody> and optional <tfoot>; no second interactive header. */
  children: ReactNode
  caption?: ReactNode
  /** Plain labels restore header associations inside the separate body table. */
  columnLabels?: readonly string[]
  minWidth?: number
  className?: string
  tableClassName?: string
  tableStyle?: CSSProperties
  tableProps?: Omit<TableHTMLAttributes<HTMLTableElement>, 'id' | 'children' | 'className' | 'style'>
  bodyClassName?: string
  bodyStyle?: CSSProperties
  bodyProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>
  /** Remains after the rows inside their scrollport (e.g. auto-load sentinel). */
  footer?: ReactNode
  /** Fill an already bounded flex panel instead of applying the default cap. */
  fill?: boolean
}

/** Fixed column controls above an independently scrolling, width-matched body. */
export const FrozenTable = forwardRef<HTMLDivElement, FrozenTableProps>(function FrozenTable({
  columns, header, children, caption, columnLabels, minWidth, className = '', tableClassName = '',
  tableStyle, tableProps, bodyClassName = '', bodyStyle, bodyProps, footer, fill = false,
}, forwardedRef) {
  const frameRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const { headerRef, onBodyScroll } = useSyncedScroll()
  const { width, maxHeight } = useFrozenTableLayout(frameRef, bodyRef, headerRef, fill)
  useImperativeHandle(forwardedRef, () => frameRef.current!, [])
  const style: CSSProperties = { width: width ?? '100%', minWidth, ...tableStyle }
  const tableClass = `table-fixed border-collapse text-left ${tableClassName}`
  const cols = () => <colgroup>{columns.map((column, index) => <col key={index} style={{ width: column }} />)}</colgroup>

  return (
    <div ref={frameRef} style={{ contain: 'inline-size' }} className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${fill ? 'flex-1' : ''} ${className}`}>
      <div className="shrink-0 overflow-hidden bg-neutral-50">
        <div ref={headerRef} className="overflow-x-hidden" style={{ width: width ?? '100%' }}>
          <table {...tableProps} className={tableClass} style={style}>
            {caption != null && <caption className="sr-only">{caption} column headings</caption>}
            {cols()}
            {header}
          </table>
        </div>
      </div>
      <div {...bodyProps} ref={bodyRef} tabIndex={bodyProps?.tabIndex ?? 0}
        className={`min-h-0 min-w-0 overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary ${fill ? 'flex-1' : ''} ${bodyClassName}`}
        style={{ ...(fill ? {} : { maxHeight }), ...bodyStyle }}
        onScroll={(event) => { onBodyScroll(event); bodyProps?.onScroll?.(event) }}>
        <table {...tableProps} className={tableClass} style={style}>
          {caption != null && <caption className="sr-only">{caption}</caption>}
          {cols()}
          {columnLabels && <thead className="sr-only"><tr>{columnLabels.map((label, index) => <th key={index} scope="col">{label}</th>)}</tr></thead>}
          {children}
        </table>
        {footer}
      </div>
    </div>
  )
})
