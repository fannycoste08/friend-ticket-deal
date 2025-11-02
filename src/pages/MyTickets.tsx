import { Ticket } from "lucide-react";

const MyTickets = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Mis Entradas
          </h1>
          <p className="text-muted-foreground">Gestiona tus entradas en venta</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
            <Ticket className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No tienes entradas publicadas
          </h3>
          <p className="text-muted-foreground max-w-md">
            Cuando publiques entradas para vender, aparecerán aquí
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
