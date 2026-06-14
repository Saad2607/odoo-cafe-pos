import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import '../styles/app-dialog.css';

export type DialogVariant = 'default' | 'warning' | 'danger' | 'error';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

export interface AlertOptions {
  title?: string;
  message: string;
  okLabel?: string;
  variant?: DialogVariant;
}

interface DialogAPI {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

type DialogState =
  | { type: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { type: 'alert'; options: AlertOptions; resolve: () => void }
  | null;

const DialogContext = createContext<DialogAPI | null>(null);

let globalDialog: DialogAPI | null = null;

export function registerDialogAPI(api: DialogAPI | null) {
  globalDialog = api;
}

/** Use outside React components (e.g. hooks). Requires DialogProvider mounted. */
export async function appConfirm(
  message: string,
  options?: Omit<ConfirmOptions, 'message'>,
): Promise<boolean> {
  if (!globalDialog) return false;
  return globalDialog.confirm({ message, ...options });
}

export async function appAlert(
  message: string,
  options?: Omit<AlertOptions, 'message'>,
): Promise<void> {
  if (!globalDialog) return;
  return globalDialog.alert({ message, ...options });
}

export function useDialog(): DialogAPI {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

const ICONS: Record<DialogVariant, string> = {
  default: '☕',
  warning: '⚠️',
  danger: '🗑️',
  error: '✕',
};

function AppDialogModal({
  state,
  onClose,
}: {
  state: NonNullable<DialogState>;
  onClose: (result: boolean) => void;
}) {
  const variant = state.options.variant ?? (state.type === 'alert' ? 'default' : 'warning');
  const title = state.options.title
    ?? (state.type === 'confirm' ? 'Please confirm' : 'Notice');

  return (
    <div
      className="app-dialog-overlay"
      role="presentation"
      onClick={() => onClose(false)}
    >
      <div
        className="app-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`app-dialog-icon app-dialog-icon--${variant}`}>
          {ICONS[variant]}
        </div>
        <h2 id="app-dialog-title">{title}</h2>
        <p className="app-dialog-message">{state.options.message}</p>
        <div className="app-dialog-actions">
          {state.type === 'confirm' && (
            <button
              type="button"
              className="terminal-btn cafe-btn-outline"
              onClick={() => onClose(false)}
            >
              {state.options.cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button
            type="button"
            className={`terminal-btn ${
              variant === 'danger' || variant === 'error'
                ? 'app-dialog-btn-danger'
                : 'cafe-btn-primary'
            }`}
            onClick={() => onClose(true)}
            autoFocus
          >
            {state.type === 'confirm'
              ? (state.options.confirmLabel ?? 'Confirm')
              : ((state.options as AlertOptions).okLabel ?? 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ type: 'confirm', options, resolve });
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setState({ type: 'alert', options, resolve });
    });
  }, []);

  useEffect(() => {
    registerDialogAPI({ confirm, alert });
    return () => registerDialogAPI(null);
  }, [confirm, alert]);

  function handleClose(result: boolean) {
    if (!state) return;
    if (state.type === 'confirm') {
      state.resolve(result);
    } else if (result) {
      state.resolve();
    }
    setState(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {state && <AppDialogModal state={state} onClose={handleClose} />}
    </DialogContext.Provider>
  );
}
