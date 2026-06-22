import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-100/20 dark:bg-brand-900/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-100/15 dark:bg-red-900/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-lg w-full relative z-10">
            {/* Card */}
            <div className="admin-card-surface overflow-hidden">
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-400 to-amber-400" />

              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 flex items-center justify-center shadow-inner">
                      <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shadow-sm border border-white dark:border-dark-card">
                      <Bug size={13} className="text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-8 max-w-sm mx-auto">
                  An unexpected error occurred. Don't worry — your data is safe. Try reloading or go back to the dashboard.
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-center mb-6">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white font-medium text-sm shadow-md shadow-brand-900/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
                  >
                    <RefreshCw size={15} /> Reload Page
                  </button>
                  <button
                    onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-dark-hover hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
                  >
                    <Home size={15} /> Dashboard
                  </button>
                </div>

                {/* Error details collapsible */}
                {this.state.error && (
                  <div className="border-t border-gray-100 dark:border-dark-border pt-4">
                    <button
                      onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                      className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-full"
                    >
                      {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span className="font-semibold uppercase tracking-wide">Error details</span>
                    </button>
                    {this.state.showDetails && (
                      <div className="mt-3 bg-gray-50 dark:bg-dark-hover rounded-xl p-4 border border-gray-100 dark:border-dark-border">
                        <p className="text-sm text-red-600 dark:text-red-400 font-mono break-all leading-relaxed">
                          {this.state.error.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer hint */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
              If this keeps happening, please contact the system administrator.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
