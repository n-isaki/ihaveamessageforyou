import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-brand-cream p-6">
                    <div className="bg-white p-8 rounded-2xl shadow-brand max-w-md w-full text-center border border-brand-border">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-brand-anthracite mb-2">Ups, etwas ist schiefgelaufen.</h1>
                        <p className="text-brand-text mb-6">
                            Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
                        </p>
                        {this.state.error && (
                            <pre className="bg-brand-cream-tint p-3 rounded text-left text-xs text-brand-text overflow-auto mb-6 max-h-32">
                                {this.state.error.toString()}
                            </pre>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary px-6 py-2 rounded-lg"
                        >
                            Seite neu laden
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
