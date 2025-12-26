import type { PageSizeOption } from "../../config";
import type { CartItem } from "../Product";

export type PaginationProps = {
    /** Total number of items in the dataset */
    totalItems: number;
    /** Current page size */
    pageSize: number;
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Callback when page size changes */
    onPageSizeChange: (size: PageSizeOption) => void;
};

export type ProductTableSettingsPageProps = {
    products: CartItem[];
    filterText: string;
    onUpdate: (id: string, field: keyof CartItem, value: string | number) => void;
    onDelete: (id: string) => void;
};

export interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: "danger" | "info" | "warning";
    confirmText?: string;
    cancelText?: string;
}

