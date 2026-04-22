import React from "react";
import { Box, Container, Typography, Button, Paper, Alert, Divider } from "@mui/material";
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from "@mui/icons-material";

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // TODO: Log error to error reporting service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const { fallback, showDetails = process.env.NODE_ENV === "development" } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === "function" ? fallback(error, this.handleReset) : fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              textAlign="center"
              gap={3}
            >
              {/* Error Icon */}
              <Box
                sx={{
                  bgcolor: "error.lighter",
                  borderRadius: "50%",
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ErrorIcon sx={{ fontSize: 64, color: "error.main" }} />
              </Box>

              {/* Error Title */}
              <Typography variant="h4" fontWeight="bold" color="error">
                Oops! Something went wrong
              </Typography>

              {/* Error Message */}
              <Typography variant="body1" color="text.secondary" maxWidth="sm">
                We're sorry for the inconvenience. An unexpected error has occurred. Please try
                refreshing the page or return to the home page.
              </Typography>

              {/* Error Count Warning */}
              {errorCount > 1 && (
                <Alert severity="warning" sx={{ width: "100%" }}>
                  This error has occurred {errorCount} times. You may want to contact support if the
                  problem persists.
                </Alert>
              )}

              {/* Action Buttons */}
              <Box display="flex" gap={2} mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button variant="outlined" color="primary" onClick={this.handleReload}>
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
              </Box>

              {/* Error Details (Development Only) */}
              {showDetails && error && (
                <>
                  <Divider sx={{ width: "100%", my: 2 }} />
                  <Box sx={{ width: "100%", textAlign: "left" }}>
                    <Typography variant="h6" gutterBottom color="error">
                      Error Details (Development Mode)
                    </Typography>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: "grey.100",
                        maxHeight: 300,
                        overflow: "auto",
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        <strong>Error:</strong> {error.toString()}
                        {"\n\n"}
                        <strong>Stack Trace:</strong>
                        {"\n"}
                        {error.stack}
                        {errorInfo && errorInfo.componentStack && (
                          <>
                            {"\n\n"}
                            <strong>Component Stack:</strong>
                            {"\n"}
                            {errorInfo.componentStack}
                          </>
                        )}
                      </Typography>
                    </Paper>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Note: Error details are only visible in development mode
                    </Typography>
                  </Box>
                </>
              )}

              {/* Support Information */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  If this problem continues, please contact support at{" "}
                  <a href="mailto:support@company.com">support@company.com</a>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      );
    }

    // Render children if no error
    return this.props.children;
  }
}

export default ErrorBoundary;
