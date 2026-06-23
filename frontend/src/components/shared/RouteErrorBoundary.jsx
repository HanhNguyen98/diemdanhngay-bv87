import { Component } from 'react';

/**
 * Catches render errors in a route subtree — tránh màn trắng toàn app.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[RouteErrorBoundary]', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    const { error } = this.state;
    const { title = 'Không tải được nội dung', children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback({ error, retry: this.handleRetry });

      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <p className="text-content-heading font-semibold text-sm">{title}</p>
          <p className="text-content-muted text-xs max-w-sm">
            Đã xảy ra lỗi hiển thị. Vui lòng thử tải lại.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return children;
  }
}
