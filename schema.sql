CREATE TABLE IF NOT EXISTS alimentos (
 id text PRIMARY KEY,
 nome varchar(80) NOT NULL CHECK (length(trim(nome)) > 0),
 quantidade double precision NOT NULL CHECK (quantidade > 0 AND quantidade < 'Infinity'::float8),
 unidade text NOT NULL CHECK (unidade IN ('kg','g','L','mL','unidade(s)','pacote(s)')),
 validade date NOT NULL,
 criado_em timestamptz NOT NULL DEFAULT now()
);
