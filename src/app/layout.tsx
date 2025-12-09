import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dragon's Gate Pizza",
    description: "Dragon's Gate Pizza - A new realm of pizza, arcades, and tabletop adventure.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
