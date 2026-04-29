import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // Log so the error is visible in production telemetry / dev tools.
    // eslint-disable-next-line no-console
    console.error('[UPOSA] Uncaught render error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    const isDev = import.meta.env.DEV
    const { error, errorInfo } = this.state

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-base-100">
        <div className="card max-w-2xl w-full">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
            <p className="text-base-content/70 max-w-md">
              An unexpected error occurred. Try reloading the page — if it keeps happening,
              please let us know via the contact page.
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              className="btn btn-primary gap-2 mt-4"
            >
              <RefreshCw className="w-4 h-4" /> Reload page
            </button>

            {isDev && error && (
              <div className="w-full mt-6 text-left">
                <div className="rounded-xl border border-primary/15 bg-base-200 p-4 overflow-auto max-h-72">
                  <p className="font-mono text-xs font-bold text-error mb-2">
                    {error.name}: {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-[11px] text-base-content/70 whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <pre className="text-[11px] text-base-content/60 whitespace-pre-wrap break-all mt-2 pt-2 border-t border-primary/10">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}
