const Manifesto = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <article className="max-w-3xl mx-auto fade-in-up">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Nuestro manifiesto
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
          Manifiesto Trusticket
        </h1>
        <p className="text-lg text-muted-foreground italic mb-12">
          Por qué existimos. En qué creemos. Qué hacemos juntos.
        </p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <p>
              <strong className="text-foreground">Trusticket nació de una idea sencilla:</strong>
              <br />
              la música une, pero el mercado nos aleja.
            </p>
            <p>
              Vivimos en un mundo donde ir a un concierto debería ser un momento memorable por ver a un
              artista, pero a veces lo es por lo complejo que puede llegar a ser conseguir una entrada.
              Compra con meses de antelación, precios abusivos, riesgos, estafas, bots, especulación.
            </p>
            <p>
              <strong className="text-foreground">Por eso creamos Trusticket:</strong>
              <br />
              un lugar donde las entradas se mueven entre personas de verdad, conectadas por vínculos reales.
            </p>
            <p>
              Aquí no hay algoritmos que inflan precios. No hay comisiones escondidas. No hay mercados
              opacos. Solo personas que aman la música y quieren ayudarse entre sí.
            </p>
          </div>

          <hr className="border-border/60" />

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Nuestro Compromiso</h2>
            {[
              {
                num: "01",
                title: "Somos honestos",
                desc: "Publicamos solo entradas reales. No vendemos nada que no tengamos. No engañamos ni jugamos con la ilusión de la gente.",
              },
              {
                num: "02",
                title: "Somos respetuosos",
                desc: "Tratamos a los demás como trataríamos a un amigo. Respondemos con claridad. Cumplimos nuestra palabra.",
              },
              {
                num: "03",
                title: "No especulamos",
                desc: "Trusticket no es un mercado para lucrarse. Es una red de confianza. Los precios son los justos, sin abuso.",
              },
              {
                num: "04",
                title: "Protegemos el espacio",
                desc: "No creamos cuentas falsas. No añadimos personas que no conocemos. No usamos la plataforma para fines ajenos a su espíritu.",
              },
              {
                num: "05",
                title: "Cuidamos la música",
                desc: "Estamos aquí porque amamos los conciertos, los festivales, los momentos compartidos. La música es comunidad; Trusticket también.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-4">
                <span className="text-xs font-bold text-primary mt-1 shrink-0">{item.num}</span>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-border/60" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Lo que Hacemos Juntos</h2>
            <p>
              Cuando alguien compra o vende una entrada aquí, no solo intercambia un ticket: construye
              confianza para toda la comunidad.
            </p>
            <p>
              Cada gesto honesto, cada trato justo, cada interacción cuidada es lo que hace que Trusticket
              funcione y que podamos seguir disfrutando de la música desde un lugar seguro, limpio y humano.
            </p>
          </div>

          <hr className="border-border/60" />

          <div className="text-center py-8 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Gracias por formar parte.</h2>
            <p>
              Tu presencia aquí hace posible lo que ninguna plataforma ha conseguido: una red de confianza
              real entre personas reales.
            </p>
            <p className="font-semibold text-foreground text-lg">
              Bienvenido a Trusticket.
              <br />
              La música se vive mejor cuando confiamos los unos en los otros.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default Manifesto;
