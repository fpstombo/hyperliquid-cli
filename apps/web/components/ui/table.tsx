import type { ReactNode } from "react"

type TableColumn<T> = {
  key: keyof T
  header: string
  align?: "left" | "right"
  render?: (row: T) => ReactNode
}

type TableProps<T extends { id?: string | number }> = {
  columns: TableColumn<T>[]
  rows: T[]
  emptyState?: string
}

export function Table<T extends { id?: string | number }>({ columns, rows, emptyState = "No data available." }: TableProps<T>) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} style={{ textAlign: column.align ?? "left" }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {columns.map((column) => (
                  <td key={String(column.key)} style={{ textAlign: column.align ?? "left" }}>
                    {column.render ? column.render(row) : String(row[column.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
