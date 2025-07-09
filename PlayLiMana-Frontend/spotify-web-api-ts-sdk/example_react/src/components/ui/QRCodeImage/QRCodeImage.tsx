import React, { useState } from "react";

interface QRCodeImageProps {
    src: string;
    alt?: string;
    size?: number; // Optional: size in px (square)
    name?: string; // Name of downloadable file
}

const QRCodeImage: React.FC<QRCodeImageProps> = ({
    src,
    alt = "QR Code",
    size = 200,
    name,
}) => {
    const [hovered, setHovered] = useState(false);
    const [btnHovered, setBtnHovered] = useState(false);

    const getDownloadName = (): string => {
        return (!name || !name.trim()) ? "qrcode.png" : `${name}.png`;
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = src;
        link.download = getDownloadName();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                margin: "auto",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img
                src={src}
                alt={alt}
                width={size}
                height={size}
                style={{
                    display: "block",
                    filter: hovered ? "brightness(0.6)" : "none",
                    transition: "filter 0.3s ease",
                    borderRadius: 8,
                }}
            />
            {hovered && (
                <button
                    onClick={handleDownload}
                    onMouseEnter={() => setBtnHovered(true)}
                    onMouseLeave={() => setBtnHovered(false)}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: btnHovered
                            ? "var(--text-accent-darker)"
                            : "var(--text-accent)",
                        border: "none",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: 5,
                        cursor: "pointer",
                        fontSize: 14,
                        userSelect: "none",
                        transition: "background-color 0.3s ease",
                    }}
                    aria-label="Download QR Code"
                >
                    Download
                </button>
            )}
        </div>
    );
};

export default QRCodeImage;