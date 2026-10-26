import type { Metadata } from "next";
import "./globals.css";

import WhatsAppConsultas from "../components/WhatsAppConsultas";

export const metadata: Metadata = {
  title: "BARBER VIPP | Turnos Online",
  description:
    "Reservá tu turno online en Barber VIPP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}

        <WhatsAppConsultas />
      </body>
    </html>
  );
}