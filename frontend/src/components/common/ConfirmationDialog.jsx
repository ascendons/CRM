import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  HelpOutline as QuestionIcon,
} from '@mui/icons-material';

/**
 * Reusable Confirmation Dialog Component
 *
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onClose - Callback when dialog is closed without confirmation
 * @param {function} onConfirm - Callback when user confirms the action
 * @param {string} title - Dialog title
 * @param {string} message - Main message to display
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} severity - Type: 'warning', 'error', 'info', 'question' (default: 'warning')
 * @param {string} confirmColor - Color for confirm button (default: 'error' for warning/error, 'primary' otherwise)
 * @param {string} details - Additional details or consequences (optional)
 * @param {boolean} loading - Shows loading state on confirm button (default: false)
 */
const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
  confirmColor,
  details,
  loading = false,
}) => {
  // Determine icon and colors based on severity
  const getSeverityConfig = () => {
    switch (severity) {
      case 'error':
        return {
          icon: <ErrorIcon sx={{ fontSize: 48 }} />,
          color: 'error.main',
          bgColor: 'error.lighter',
          defaultConfirmColor: 'error',
        };
      case 'warning':
        return {
          icon: <WarningIcon sx={{ fontSize: 48 }} />,
          color: 'warning.main',
          bgColor: 'warning.lighter',
          defaultConfirmColor: 'warning',
        };
      case 'info':
        return {
          icon: <InfoIcon sx={{ fontSize: 48 }} />,
          color: 'info.main',
          bgColor: 'info.lighter',
          defaultConfirmColor: 'primary',
        };
      case 'question':
        return {
          icon: <QuestionIcon sx={{ fontSize: 48 }} />,
          color: 'primary.main',
          bgColor: 'primary.lighter',
          defaultConfirmColor: 'primary',
        };
      default:
        return {
          icon: <WarningIcon sx={{ fontSize: 48 }} />,
          color: 'warning.main',
          bgColor: 'warning.lighter',
          defaultConfirmColor: 'warning',
        };
    }
  };

  const config = getSeverityConfig();
  const finalConfirmColor = confirmColor || config.defaultConfirmColor;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              bgcolor: config.bgColor,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: config.color,
            }}
          >
            {config.icon}
          </Box>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">
          {message}
        </DialogContentText>

        {details && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              borderLeft: 3,
              borderColor: config.color,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color={finalConfirmColor}
          variant="contained"
          disabled={loading}
          autoFocus
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
