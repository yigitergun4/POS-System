import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import ConfirmationModal from "../components/ConfirmationModal";
import type { ConfirmationContextType, ConfirmationOptions } from "../types/contexts";

const ConfirmationContext: React.Context<ConfirmationContextType | undefined> = createContext<ConfirmationContextType | undefined>(
  undefined
);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmationOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { title: "", message: "" },
    resolve: null,
  });

  const confirm = useCallback(
    (options: ConfirmationOptions) => {
      return new Promise<boolean>((resolve) => {
        setModalState({
          isOpen: true,
          options,
          resolve,
        });
      });
    },
    []
  );

  const handleClose: () => void = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm: () => void = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.options.title}
        message={modalState.options.message}
        type={modalState.options.type}
        confirmText={modalState.options.confirmText}
        cancelText={modalState.options.cancelText}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error(
      "useConfirmation must be used within a ConfirmationProvider"
    );
  }
  return context;
}
