import classNames from "classnames";

interface ButtonProps {
    onClick?: () => void;
    className: string;
    testId?: string;
    type?: "submit" | "button" | "reset";
    disabled?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    testId,
    className,
    type = "submit",
    disabled = false,
}) => {
    return (
        <button
            type={type}
            data-testid={testId}
            onClick={onClick}
            disabled={disabled}
            className={classNames(
                "bg-rose-400 p-2 rounded-lg hover:bg-rose-600 text-white",
                { "opacity-50 cursor-not-allowed": disabled },
                className
            )}
        >
            {children}
        </button>
    );
};
