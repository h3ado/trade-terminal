import React from 'react';

interface State { hasError: boolean; msg?: string }

/** Catches R3F render errors so a broken layer doesn't crash the whole canvas. */
export class GlobeErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any): State {
    return { hasError: true, msg: String(err?.message ?? err) };
  }
  componentDidCatch(err: any) {
    // eslint-disable-next-line no-console
    console.error('[Globe] render error:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-deep/90 font-mono text-[10px] text-negative p-4 text-center">
          GLOBE RENDER ERROR<br />
          <span className="text-muted-foreground mt-1">{this.state.msg}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
