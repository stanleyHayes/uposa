import type { ReactNode } from 'react'
import { PERMISSION_ACTIONS, type PermissionAction, type PermissionCatalogEntry } from '../../types'

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
}

interface PermissionGridProps {
  catalog: PermissionCatalogEntry[]
  /** Content for a cell whose action the resource supports; unsupported cells stay blank. */
  renderCell: (entry: PermissionCatalogEntry, action: PermissionAction) => ReactNode
  /** Optional control under a column heading (e.g. select-all for the column). */
  renderColumnControl?: (action: PermissionAction) => ReactNode
  /** Optional trailing control per row (e.g. select-all for the row). */
  renderRowControl?: (entry: PermissionCatalogEntry) => ReactNode
  rowControlLabel?: string
}

/** Rows are catalog resources; columns are View / Create / Edit / Delete. */
export default function PermissionGrid({ catalog, renderCell, renderColumnControl, renderRowControl, rowControlLabel }: PermissionGridProps) {
  return (
    <div className="overflow-x-auto border border-gray-100 dark:border-dark-border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-dark-hover border-b border-gray-100 dark:border-dark-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area</th>
            {PERMISSION_ACTIONS.map((action) => (
              <th key={action} className="px-3 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                <div>{ACTION_LABELS[action]}</div>
                {renderColumnControl && <div className="mt-1.5 flex justify-center normal-case font-normal tracking-normal">{renderColumnControl(action)}</div>}
              </th>
            ))}
            {renderRowControl && (
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">{rowControlLabel ?? ''}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {catalog.map((entry) => (
            <tr key={entry.resource} className="hover:bg-gray-50/60 dark:hover:bg-dark-hover/40">
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-gray-900 dark:text-gray-100">{entry.label}</p>
                {entry.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.description}</p>}
              </td>
              {PERMISSION_ACTIONS.map((action) => (
                <td key={action} className="px-3 py-3 text-center align-middle">
                  {entry.actions.includes(action) ? renderCell(entry, action) : null}
                </td>
              ))}
              {renderRowControl && <td className="px-3 py-3 text-center align-middle">{renderRowControl(entry)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
