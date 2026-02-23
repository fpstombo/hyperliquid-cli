import type { CSSProperties, HTMLAttributes, ReactNode } from "react"

type TableDensity = "compact" | "regular"

type TableColumn<T> = {
  key: keyof T | string
  header: string
  align?: "left" | "right"
  className?: string
  width?: CSSProperties["width"]
  minWidth?: CSSProperties["minWidth"]
  render?: (row: T, index: number) => ReactNode
}

type TableRowRenderer<T> = (params: { index: number; row: T | undefined }) => ReactNode

type TableProps<T> = {
  columns: TableColumn<T>[]
  rows?: T[]
  rowKey?: (row: T, index: number) => string | number
  emptyState?: string
  stickyHeader?: boolean
  density?: TableDensity
  itemCount?: number
  itemSize?: number
  rowRenderer?: TableRowRenderer<T>
  getRowProps?: (row: T, index: number) => HTMLAttributes<HTMLTableRowElement>
}

export function Table<T>({
  columns,
  rows = [],
  rowKey,
  emptyState = "No data available.",
  stickyHeader = true,
  density = "compact",
  itemCount,
  itemSize,
  rowRenderer,
  getRowProps,
}: TableProps<T>) {
  const resolvedItemCount = itemCount ?? rows.length
  const resolvedRowHeight = itemSize ?? (density === "compact" ? 40 : 48)

  const isNumericColumn = (className?: string) => className?.split(" ").includes("table-col--numeric") ?? false

  return (
    <div className="table-wrap">
      <table className={`table table--${density} ${stickyHeader ? "table--sticky-header" : ""}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={column.className}
                data-align={column.align ?? "left"}
                style={{
                  "--table-column-width": column.width,
                  "--table-column-min-width": column.minWidth,
                } as CSSProperties}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resolvedItemCount === 0 ? (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyState}
              </td>
            </tr>
          ) : (
            Array.from({ length: resolvedItemCount }, (_, index) => {
              const row = rows[index]
              if (rowRenderer) {
                return rowRenderer({ index, row })
              }

              if (!row) {
                return null
              }

              const resolvedRowProps = getRowProps?.(row, index)

              return (
                <tr
                  key={rowKey ? rowKey(row, index) : index}
                  {...resolvedRowProps}
                  style={{
                    "--table-row-height": `${resolvedRowHeight}px`,
                    ...(resolvedRowProps?.style ?? {}),
                  } as CSSProperties}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={column.className}
                      data-align={column.align ?? "left"}
                      style={{
                        "--table-column-width": column.width,
                        "--table-column-min-width": column.minWidth,
                      } as CSSProperties}
                    >
                      <span className={isNumericColumn(column.className) ? "table-numeric-text" : undefined}>
                        {column.render ? column.render(row, index) : String((row as Record<string, unknown>)[column.key as string] ?? "")}
                      </span>
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export type { TableColumn, TableDensity, TableProps, TableRowRenderer }
