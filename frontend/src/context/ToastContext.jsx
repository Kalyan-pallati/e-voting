import { createContext, useContext, useState } from "react";
import Toast from "../components/Toast.jsx"

const ToastContext = createContext();

export default function ToastProvider({children}) {
    const [toasts, setToasts] = useState(null);

    const showToast = (message, duration = 3000) => {
        setToasts({ message });
        setTimeout(() => {
            setToasts(null);
        }, duration);
    }
    return (
        <ToastContext.Provider value={{ showToast }} >
            {children}
            {toasts && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                    <Toast message={toasts.message} />
                </div>
            )}
        </ToastContext.Provider>
    );
}
export const useToast = () => useContext(ToastContext);