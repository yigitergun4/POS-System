export interface ConfirmationOptions {
    title: string;
    message: string;
    type?: "danger" | "info" | "warning";
    confirmText?: string;
    cancelText?: string;
}

export interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
}
