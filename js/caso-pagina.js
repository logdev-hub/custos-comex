(function () {
  "use strict";
  const $ = (s) => document.querySelector(s),
    C = Calculos,
    D = DADOS_2026,
    brl = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    usd = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    }),
    num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const H = {
    1: [
      "Marina, nova analista de uma integradora de automação, recebe a missão de acompanhar 1.500 componentes da China até Guarulhos. Como a carga ocupa apenas 5 m³, ela escolhe dividir um contêiner com outros importadores.",
      "O volume determina a cobrança. LCL faz sentido, mas mínimos de frete, desconsolidação e armazenagem precisam ser observados.",
      [
        "W/M compara volume e tonelada",
        "Cargas pequenas também pagam mínimos",
        "AFRMM só existe no aquaviário",
      ],
    ],
    2: [
      "Rafael compra peças metálicas para uma fábrica de máquinas. O lote de 12 toneladas e 18 m³ parece grande o bastante para um contêiner 20’ exclusivo, mas ele precisa medir o aproveitamento.",
      "O contêiner tem folga de volume e peso. A decisão FCL considera proteção e controle, além do espaço utilizado.",
      [
        "Volume e payload são limites distintos",
        "FCL possui custos próprios",
        "Break-even varia com cada cotação",
      ],
    ],
    3: [
      "Cláudia coordena a chegada de móveis desmontados para o lançamento de uma coleção. São 55 m³ e 22 toneladas em um 40’ High Cube, com data marcada para chegar às lojas.",
      "O equipamento está bem ocupado e o peso é o limite mais próximo. Free time e armazenagem são tão importantes quanto o frete.",
      [
        "High Cube favorece carga volumosa",
        "Percentual pode superar o mínimo",
        "Frete maior também altera outras bases",
      ],
    ],
    4: [
      "Diego recebe uma ligação urgente: sem os equipamentos eletrônicos, uma linha de produção pode parar. Cinco pallets precisam sair de Pudong e chegar rapidamente a Guarulhos.",
      "Embora a balança mostre 600 kg, o espaço ocupado equivale a 1.100 kg tarifáveis. Reduzir embalagem pode reduzir o frete.",
      [
        "Dimensões viram peso tarifável",
        "A embalagem tem efeito financeiro",
        "Urgência precisa ter valor econômico",
      ],
    ],
    5: [
      "Helena importa microcomponentes pequenos, mas o único pallet vale USD 250 mil. Pouco peso não significa uma operação simples ou barata.",
      "O CIF por kg é muito alto. Seguro, segurança, preparação antecipada e permanência mínima no terminal são prioridades.",
      [
        "Calcular CIF por kg líquido",
        "Seguro deve refletir o risco real",
        "Cada dia imobiliza muito capital",
      ],
    ],
    6: [
      "Paulo precisa contratar os caminhões das duas pontas. Ele logo percebe que não existe uma viagem rodoviária China–Brasil: existem dois trechos locais separados pelo oceano.",
      "Suzhou–Shanghai é o first mile; Santos–Guarulhos é o last mile. No Brasil, os coeficientes ANTT precisam corresponder ao veículo real.",
      [
        "Não há rodoviário direto China–Brasil",
        "Piso = CCD × distância + CC",
        "Vazio, pedágio e espera são adicionais",
      ],
    ],
    7: [
      "Cláudia retorna ao caso do mobiliário, mas agora a carga entra em conferência. O contêiner não sai no prazo e cada novo dia aciona outras despesas.",
      "O atraso cria um efeito cascata: armazenagem, inspeção, demurrage, detention e capital aumentam juntos.",
      [
        "Armazenagem muda por período",
        "Demurrage não é detention",
        "Tempo aciona vários custos",
      ],
    ],
    8: [
      "Marina recebe quatro propostas para a mesma mercadoria: EXW, FOB, CIF e DAP. Os preços são diferentes porque cada proposta inclui responsabilidades diferentes.",
      "Ela precisa reconstruir todas as propostas até o mesmo destino e eliminar dupla contagem antes de comparar.",
      [
        "Custo e risco podem mudar em pontos distintos",
        "É preciso marcar o que já está incluído",
        "A comparação correta usa o mesmo destino",
      ],
    ],
  };
  function armazenagemMaritima(c, cif) {
    const perfil =
      c.modal === "lcl"
        ? D.dpw.lcl
        : c.container === "20dry"
          ? D.dpw.fcl20
          : D.dpw.fcl40;
    let restantes = Math.max(1, c.diasTerminal || 1),
      indice = 0,
      total = 0;
    const periodos = [];
    while (restantes > 0) {
      const faixa = perfil[Math.min(indice, perfil.length - 1)];
      const valorPercentual = cif * faixa.p;
      const valor = Math.max(valorPercentual, faixa.min);
      periodos.push({
        numero: indice + 1,
        dias: Math.min(restantes, faixa.dias),
        percentual: faixa.p,
        minimo: faixa.min,
        percentualCalculado: valorPercentual,
        valor,
        criterio: valorPercentual >= faixa.min ? "percentual" : "mínimo",
      });
      total += valor;
      restantes -= faixa.dias;
      indice++;
    }
    return { total, periodos };
  }
  function armazenagemAerea(c, cif) {
    const cifKg = cif / Math.max(1, c.pesoLiquido);
    let altoValor = null;
    if (cifKg >= 10742.59 && cifKg <= 42970.34) altoValor = 0.0044;
    else if (cifKg <= 171881.38 && cifKg > 42970.34) altoValor = 0.0022;
    else if (cifKg > 171881.38) altoValor = 0.0011;
    if (altoValor)
      return {
        total: cif * altoValor,
        cifKg,
        altoValor: true,
        percentual: altoValor,
        faixa: "Tabela 11 — alto valor específico",
      };
    const faixa = D.gru.faixas.find((x) => c.diasTerminal <= x.ate);
    const percentual = faixa
      ? faixa.p
      : 0.033 + Math.ceil((c.diasTerminal - 20) / 10) * 0.0165;
    return {
      total: cif * percentual,
      cifKg,
      altoValor: false,
      percentual,
      faixa: "Tabela 7 — carga importada",
    };
  }
  function calc(c) {
    const fx = c.cambio || 5.5;
    let frete = c.frete || 0,
      rt = C.wm(c.pesoBruto, c.volume),
      pv = C.pesoVolumetrico(
        c.comprimento,
        c.largura,
        c.altura,
        c.volumes,
        6000,
      ),
      pt = C.pesoTarifavel(c.pesoBruto, pv);
    if (c.modal === "aereo")
      frete =
        pt * (D.aereo.tarifaKg + D.aereo.fuelKg + D.aereo.securityKg) +
        D.aereo.awb;
    if (c.modal === "lcl")
      frete = frete || C.freteLCL(rt, D.maritimo.lclRt, D.maritimo.lclMin);
    if (c.modal === "fcl" && !frete)
      frete = c.container === "20dry" ? D.maritimo.fcl20 : D.maritimo.fcl40hc;
    const seg = C.seguro(c.fob + frete + 250, 1.1, 0.0035, 25),
      vaUsd = c.fob + frete + seg.premio,
      va = vaUsd * fx,
      afr = C.afrmm(frete * fx, 0.08, c.modal !== "aereo"),
      t = C.tributos(va, c, afr, 1800),
      armazenagemDetalhe =
        c.modal === "aereo"
          ? armazenagemAerea(c, va)
          : armazenagemMaritima(c, va),
      arm = armazenagemDetalhe.total,
      capataziaAerea =
        c.modal === "aereo"
          ? Math.max(c.pesoBruto * D.gru.capataziaKg, D.gru.capataziaMin)
          : 250,
      operacaoDestino = c.modal === "aereo" ? 650 + capataziaAerea : 900,
      cap = C.custoCapital(
        c.fob * fx,
        0.012,
        (c.transito || 40) + (c.diasTerminal || 4),
      ),
      log =
        (frete + seg.premio + 430) * fx +
        4180 +
        operacaoDestino +
        (c.demurrage || 0) +
        (c.detention || 0) +
        (c.id === 7 ? 1800 : 0),
      tlc = C.totalLandedCost({
        mercadoria: c.fob * fx,
        logistica: log,
        tributos: t.total,
        afrmm: afr,
        armazenagem: arm,
        capital: cap,
      });
    return {
      fx,
      frete,
      rt,
      pv,
      pt,
      seg,
      vaUsd,
      va,
      afr,
      t,
      arm,
      armazenagemDetalhe,
      capataziaAerea,
      cap,
      log,
      tlc,
    };
  }
  function specific(id, c, r) {
    if (id === 1)
      return {
        title: "Descobrimos como o LCL será cobrado",
        text: `O peso de ${num.format(c.pesoBruto)} kg corresponde a ${num.format(c.pesoBruto / 1000)} tonelada. Como ${num.format(c.volume)} m³ é maior, o volume vence a comparação. A unidade tarifável é ${num.format(r.rt)} RT.`,
        formula: `RT = máximo(${num.format(c.volume)} m³; ${num.format(c.pesoBruto / 1000)} t) = ${num.format(r.rt)} RT`,
      };
    if ([2, 3].includes(id)) {
      const x = D.containers[c.container];
      return {
        title: "Conferimos a ocupação do contêiner",
        text: `A carga utiliza ${num.format((c.volume / x.volume) * 100)}% do volume interno e ${num.format((c.pesoBruto / x.payload) * 100)}% do payload. O maior percentual aponta o fator mais próximo do limite, mas formato e distribuição também precisam ser verificados.`,
        formula: `volume = ${num.format(c.volume)} ÷ ${num.format(x.volume)}; peso = ${num.format(c.pesoBruto)} ÷ ${num.format(x.payload)}`,
      };
    }
    if ([4, 5].includes(id))
      return {
        title: "Transformamos espaço em peso tarifável",
        text: `As dimensões resultam em ${num.format(r.pv)} kg volumétricos. Comparamos esse número com ${num.format(c.pesoBruto)} kg reais e cobramos o maior: ${num.format(r.pt)} kg.`,
        formula: `comprimento × largura × altura × volumes ÷ 6.000 = ${num.format(r.pv)} kg`,
      };
    if (id === 6)
      return {
        title: "Separamos os dois caminhões",
        text: `O first mile percorre ${num.format(c.distChina)} km de Suzhou a Shanghai. O last mile percorre ${num.format(c.distBrasil)} km de Santos a Guarulhos. CCD e CC oficiais são escolhidos para a carga e composição corretas.`,
        formula: "piso brasileiro = CCD × 95 km + CC + pedágios + adicionais",
      };
    if (id === 7)
      return {
        title: "Isolamos o custo causado pelo atraso",
        text: `Só demurrage e detention somam ${brl.format((c.demurrage || 0) + (c.detention || 0))}. A nova permanência também muda armazenagem e custo de capital.`,
        formula: `${brl.format(c.demurrage)} + ${brl.format(c.detention)} = ${brl.format(c.demurrage + c.detention)}`,
      };
    return {
      title: "Colocamos todas as propostas na mesma base",
      text: "EXW transfere tarefas cedo; FOB entrega a bordo; CIF inclui frete e seguro, embora o risco transfira na origem; DAP leva até o destino, mas não realiza a importação. Marcamos o que já está incluído para não contar duas vezes.",
      formula:
        "preço comparável = proposta + custos ainda não incluídos até o CD",
    };
  }
  function steps(id, c, r) {
    const s = specific(id, c, r);
    return [
      s,
      {
        title: "Partimos do valor da mercadoria",
        text: `O lote tem ${num.format(c.quantidade)} unidades e FOB de ${usd.format(c.fob)}. Ao câmbio didático de R$ ${num.format(r.fx)}, a mercadoria representa ${brl.format(c.fob * r.fx)}.`,
        formula: `${usd.format(c.fob)} × ${num.format(r.fx)} = ${brl.format(c.fob * r.fx)}`,
      },
      {
        title: "Calculamos o frete e o seguro",
        text: `O frete internacional estimado é ${usd.format(r.frete)}. O seguro considera base segurável, cobertura de 110%, taxa didática de 0,35% e mínimo. O prêmio obtido é ${usd.format(r.seg.premio)}.`,
        formula: `prêmio = máximo(base × 110% × 0,35%; mínimo)`,
      },
      {
        title: "Formamos o valor aduaneiro",
        text: "Somamos mercadoria, frete e seguro em dólares e convertemos pela taxa aduaneira informada. Essa base alimentará os tributos.",
        formula: `${usd.format(c.fob)} + ${usd.format(r.frete)} + ${usd.format(r.seg.premio)} = ${usd.format(r.vaUsd)}; × ${num.format(r.fx)} = ${brl.format(r.va)}`,
      },
      {
        title: "Calculamos cada tributo na base correta",
        text: `II ${brl.format(r.t.ii)}, IPI ${brl.format(r.t.ipi)}, PIS ${brl.format(r.t.pis)}, Cofins ${brl.format(r.t.cofins)} e ICMS por dentro ${brl.format(r.t.icms)}. O NCM ${c.ncm} e as alíquotas são didáticos e precisam de validação.`,
        formula: `tributos tradicionais = ${brl.format(r.t.total)}; AFRMM = ${brl.format(r.afr)}`,
      },
      {
        title: "Incluímos terminal e custo do tempo",
        text: `A armazenagem estimada é ${brl.format(r.arm)}. O capital imobilizado no trânsito e terminal custa ${brl.format(r.cap)} na premissa de 1,20% ao mês.`,
        formula: "capital = mercadoria em reais × taxa mensal × dias ÷ 30",
      },
      {
        title: "Fechamos o custo posto no destino",
        text: "Somamos mercadoria, logística internacional, seguro, origem, destino, aduana, rodoviário, tributos, AFRMM quando aplicável, armazenagem e capital.",
        formula: `Total Landed Cost estimado = ${brl.format(r.tlc)}`,
      },
    ];
  }
  function custosDetalhados(id, c, r) {
    const linha = (
      grupo,
      item,
      origem,
      formula,
      usdValor,
      brlValor,
      nivel,
    ) => ({
      grupo,
      item,
      origem,
      formula,
      usd: usdValor,
      brl: brlValor ?? usdValor * r.fx,
      nivel,
    });
    const itens = [
      linha(
        "Origem",
        "Coleta / first mile na China",
        "Suzhou → Shanghai/PVG",
        "valor informado",
        180,
        null,
        "D",
      ),
      linha(
        "Origem",
        "Documentação e despacho de exportação",
        "Agente na origem",
        "valor informado",
        90,
        null,
        "D",
      ),
      linha(
        "Origem",
        c.modal === "aereo"
          ? "Handling no aeroporto PVG"
          : "Handling / recebimento no terminal",
        c.portoOrigem,
        "valor informado",
        160,
        null,
        "D",
      ),
    ];
    if (c.modal === "aereo") {
      itens.push(
        linha(
          "Internacional",
          "Frete aéreo base",
          "Benchmark China–Brasil",
          `${num.format(r.pt)} kg × USD ${num.format(D.aereo.tarifaKg)}/kg`,
          r.pt * D.aereo.tarifaKg,
          null,
          "C",
        ),
        linha(
          "Internacional",
          "Fuel surcharge",
          "Benchmark editável",
          `${num.format(r.pt)} kg × USD ${num.format(D.aereo.fuelKg)}/kg`,
          r.pt * D.aereo.fuelKg,
          null,
          "C",
        ),
        linha(
          "Internacional",
          "Security surcharge",
          "Benchmark editável",
          `${num.format(r.pt)} kg × USD ${num.format(D.aereo.securityKg)}/kg`,
          r.pt * D.aereo.securityKg,
          null,
          "C",
        ),
        linha(
          "Internacional",
          "AWB",
          "Premissa administrativa",
          "valor por conhecimento aéreo",
          D.aereo.awb,
          null,
          "D",
        ),
      );
    } else {
      itens.push(
        linha(
          "Internacional",
          c.modal === "lcl" ? "Frete marítimo LCL" : "Frete marítimo FCL",
          "Cotação/benchmark Shanghai–Santos",
          c.modal === "lcl"
            ? `máx(${num.format(r.rt)} RT × tarifa; mínimo)`
            : "valor por contêiner",
          r.frete,
          null,
          "C",
        ),
      );
    }
    itens.push(
      linha(
        "Seguro",
        "Prêmio do seguro internacional",
        "Premissa didática editável",
        "máx(base × 110% × 0,35%; mínimo)",
        r.seg.premio,
        null,
        "D",
      ),
      linha(
        "Destino",
        c.modal === "aereo"
          ? "Handling e desconsolidação"
          : c.modal === "lcl"
            ? "Desconsolidação e handling"
            : "THC de destino",
        c.portoDestino,
        "valor informado",
        null,
        350,
        "D",
      ),
      linha(
        "Destino",
        "Capatazia / movimentação",
        c.terminal,
        c.modal === "aereo"
          ? `máx(${num.format(c.pesoBruto)} kg × R$ ${num.format(D.gru.capataziaKg)}; R$ ${num.format(D.gru.capataziaMin)})`
          : "valor informado",
        null,
        c.modal === "aereo" ? r.capataziaAerea : 250,
        c.modal === "aereo" ? "B" : "D",
      ),
      linha(
        "Destino",
        c.modal === "aereo"
          ? "Liberação documental da carga"
          : "Delivery order / liberação",
        c.portoDestino,
        "valor informado",
        null,
        200,
        "D",
      ),
      linha(
        "Destino",
        c.modal === "aereo"
          ? "Screening e transferência interna"
          : "Pesagem e carregamento de saída",
        c.terminal,
        "valor informado",
        null,
        100,
        "D",
      ),
      linha(
        "Terminal",
        c.modal === "aereo"
          ? "Armazenagem aeroportuária"
          : "Armazenagem portuária",
        c.terminal,
        c.modal === "aereo"
          ? "CIF × faixa de permanência"
          : "máx(CIF × percentual; mínimo)",
        null,
        r.arm,
        "B",
      ),
      linha(
        "Administrativo",
        "Honorários do despachante",
        "Prestador aduaneiro",
        "valor informado",
        null,
        1200,
        "D",
      ),
      linha(
        "Administrativo",
        "Elaboração da declaração e documentos",
        "Despacho de importação",
        "valor informado",
        null,
        300,
        "D",
      ),
      linha(
        "Administrativo",
        "Tarifas bancárias, câmbio e SWIFT",
        "Instituição financeira",
        "valor informado",
        null,
        300,
        "D",
      ),
      linha(
        "Rodoviário",
        "Last mile até o centro de distribuição",
        `${c.portoDestino} → ${c.destino}`,
        "valor informado",
        null,
        2200,
        "D",
      ),
      linha(
        "Rodoviário",
        "Pedágios e acesso",
        "Trecho brasileiro",
        "valor informado",
        null,
        180,
        "D",
      ),
    );
    if (r.afr > 0)
      itens.push(
        linha(
          "Tributo logístico",
          "AFRMM",
          "Longo curso aquaviário",
          "frete aquaviário × 8%",
          null,
          r.afr,
          "A",
        ),
      );
    if (c.demurrage)
      itens.push(
        linha(
          "Atraso",
          "Demurrage",
          "Permanência no terminal após free time",
          "faixas progressivas / valor do caso",
          null,
          c.demurrage,
          "D",
        ),
      );
    if (c.detention)
      itens.push(
        linha(
          "Atraso",
          "Detention",
          "Equipamento fora do terminal",
          "faixas progressivas / valor do caso",
          null,
          c.detention,
          "D",
        ),
      );
    if (id === 7)
      itens.push(
        linha(
          "Canal aduaneiro",
          "Inspeção física",
          "Terminal de Santos",
          "premissa do cenário de atraso",
          null,
          800,
          "D",
        ),
        linha(
          "Canal aduaneiro",
          "Posicionamento do contêiner",
          "Terminal de Santos",
          "premissa do cenário de atraso",
          null,
          600,
          "D",
        ),
        linha(
          "Canal aduaneiro",
          "Escaneamento e movimentação adicional",
          "Terminal de Santos",
          "premissa do cenário de atraso",
          null,
          400,
          "D",
        ),
      );
    itens.push(
      linha(
        "Financeiro",
        "Custo de capital em trânsito",
        "Premissa financeira",
        "FOB em reais × 1,20% a.m. × dias ÷ 30",
        null,
        r.cap,
        "D",
      ),
    );
    return itens;
  }
  function inserirPlanilha(id, c, r) {
    const itens = custosDetalhados(id, c, r);
    const subtotal = itens.reduce((s, x) => s + x.brl, 0);
    const porGrupo = Object.entries(
      itens.reduce((a, x) => ((a[x.grupo] = (a[x.grupo] || 0) + x.brl), a), {}),
    );
    const section = document.createElement("section");
    section.className = "chapter";
    section.innerHTML = `<span class="chapter-tag">PLANILHA OPERACIONAL</span><h2>Todos os custos, sem esconder nenhuma etapa</h2><p>A tabela abre o transporte em parcelas. Valores C são benchmarks comerciais; valores D são premissas didáticas editáveis; B identifica tabela pública de terminal e A, referência oficial. Nenhuma linha deve ser usada como cotação definitiva.</p><div class="table-responsive"><table class="table cost-table"><thead><tr><th>Grupo</th><th>Custo</th><th>Onde ocorre</th><th>Como foi calculado</th><th>USD</th><th>BRL</th><th>Nível</th></tr></thead><tbody>${itens.map((x) => `<tr><td>${x.grupo}</td><td><b>${x.item}</b></td><td>${x.origem}</td><td>${x.formula}</td><td>${x.usd == null ? "—" : usd.format(x.usd)}</td><td>${brl.format(x.brl)}</td><td><span class="level level-${x.nivel.toLowerCase()}">${x.nivel}</span></td></tr>`).join("")}</tbody><tfoot><tr><th colspan="5">Subtotal das parcelas logísticas, terminal, AFRMM e capital</th><th>${brl.format(subtotal)}</th><th></th></tr></tfoot></table></div><h3>Leitura por grupo</h3><div class="cost-summary">${porGrupo.map(([g, v]) => `<div><small>${g}</small><b>${brl.format(v)}</b></div>`).join("")}</div><div class="highlight mt-4"><b>Como ler corretamente:</b> este subtotal não é o TLC. O TLC também contém o valor da própria mercadoria e os tributos de importação apresentados na próxima seção.</div>`;
    const resultados = $("#results").closest(".chapter");
    resultados.parentNode.insertBefore(section, resultados);
  }
  function inserirPainelTerminal(c, r) {
    const section = document.createElement("section");
    section.className = "chapter";
    if (c.modal === "aereo") {
      const transferencia = Math.max(
        c.pesoBruto * D.gru.transferenciaKg,
        D.gru.transferenciaMin,
      );
      const faixas = [
        ["Até 2 dias úteis", "0,55% do CIF"],
        ["3 a 5 dias úteis", "1,10% do CIF"],
        ["6 a 10 dias úteis", "1,65% do CIF"],
        ["11 a 20 dias úteis", "3,30% do CIF"],
        ["Cada 10 dias ou fração após o 4º período", "+1,65% cumulativo"],
      ];
      const altoValor = [
        ["R$ 10.742,59 a R$ 42.970,34/kg", "0,44% do CIF"],
        ["R$ 42.970,35 a R$ 171.881,38/kg", "0,22% do CIF"],
        ["Acima de R$ 171.881,39/kg", "0,11% do CIF"],
      ];
      section.innerHTML = `<span class="chapter-tag">TARIFAS AEROPORTUÁRIAS • GRU</span><h2>Como o Terminal de Cargas cobra esta operação?</h2><p>GRU combina armazenagem pelo valor CIF com capatazia pelo peso bruto. As duas tabelas são cumulativas na operação comum. Para fins tarifários divulgados pelo terminal, todos os dias de funcionamento são considerados úteis.</p><div class="terminal-result"><div><small>Tabela aplicável</small><b>${r.armazenagemDetalhe.faixa}</b></div><div><small>CIF por kg líquido</small><b>${brl.format(r.armazenagemDetalhe.cifKg)}/kg</b></div><div><small>Armazenagem calculada</small><b>${brl.format(r.arm)}</b></div><div><small>Capatazia calculada</small><b>${brl.format(r.capataziaAerea)}</b></div></div><h3>Tabela 7 — armazenagem comum de importação</h3><div class="table-responsive"><table class="table tariff-table"><thead><tr><th>Período</th><th>Tarifa</th><th>Incidência</th></tr></thead><tbody>${faixas.map((x) => `<tr><td>${x[0]}</td><td>${x[1]}</td><td>Valor CIF</td></tr>`).join("")}</tbody></table></div><h3>Tabela 8 — capatazia</h3><div class="tariff-formula"><code>máximo(${num.format(c.pesoBruto)} kg × R$ ${num.format(D.gru.capataziaKg)}; mínimo R$ ${num.format(D.gru.capataziaMin)}) = ${brl.format(r.capataziaAerea)}</code><p>Cobrada uma única vez e cumulativamente com a armazenagem comum.</p></div><h3>Tabela 11 — carga de alto valor específico</h3><div class="table-responsive"><table class="table tariff-table"><thead><tr><th>CIF por kg líquido</th><th>Percentual por 3 dias ou fração</th></tr></thead><tbody>${altoValor.map((x) => `<tr><td>${x[0]}</td><td>${x[1]}</td></tr>`).join("")}</tbody></table></div><p class="${r.armazenagemDetalhe.altoValor ? "specialist" : "explain"}"><b>Resultado do enquadramento:</b> ${r.armazenagemDetalhe.altoValor ? `o CIF específico de ${brl.format(r.armazenagemDetalhe.cifKg)}/kg entra na tabela de alto valor. Foi aplicada a taxa de ${num.format(r.armazenagemDetalhe.percentual * 100)}% sobre o CIF.` : `o CIF específico de ${brl.format(r.armazenagemDetalhe.cifKg)}/kg não alcança a primeira faixa de alto valor; permanece a tabela comum.`}</p><h3>Alternativas que precisam ser avaliadas</h3><div class="optional-services"><div><b>Casos especiais / trânsito</b><span>R$ 0,1721/kg até 4 dias úteis; mínimo R$ 21,50. Não somado porque o caso não indicou esse regime.</span></div><div><b>Transferência para zona secundária</b><span>R$ 1,0742/kg; mínimo R$ 107,43; máximo de 24 horas. Se escolhida: ${brl.format(transferencia)}.</span></div><div><b>Serviços e equipamentos adicionais</b><span>Devem ser consultados na tabela de serviços válida desde 01/01/2026 e só entram se efetivamente solicitados.</span></div></div><div class="source-card"><b>Fonte B — tabela pública</b><span>GRU Airport Cargo, tarifas e legislação. Percentuais divulgados em conformidade com a Portaria ANAC nº 15.009/2024; serviços/equipamentos com tabela indicada como válida a partir de 01/01/2026. Consulta de referência: 20/07/2026.</span><a href="https://www.grucargo.com.br/tarifas.aspx" target="_blank" rel="noopener">Consultar fonte oficial</a></div>`;
    } else {
      const perfil =
        c.modal === "lcl"
          ? D.dpw.lcl
          : c.container === "20dry"
            ? D.dpw.fcl20
            : D.dpw.fcl40;
      const ecoMin = c.container === "20dry" ? 4589.64 : 6462.51;
      const ecoPrimeiro =
        c.modal === "lcl" ? null : Math.max(r.va * 0.012, ecoMin);
      section.innerHTML = `<span class="chapter-tag">TARIFAS PORTUÁRIAS • SANTOS</span><h2>Como o terminal forma a cobrança?</h2><p>O perfil principal usa a tabela pública DP World Santos 2026. Cada período compara um percentual do CIF com um valor mínimo. Se a carga permanece além do período, uma nova faixa é acrescentada.</p><div class="terminal-result"><div><small>Terminal do caso</small><b>${c.terminal}</b></div><div><small>Permanência</small><b>${c.diasTerminal} dias</b></div><div><small>Períodos cobrados</small><b>${r.armazenagemDetalhe.periodos.length}</b></div><div><small>Armazenagem total</small><b>${brl.format(r.arm)}</b></div></div><h3>Perfil DP World Santos 2026 — ${c.modal.toUpperCase()}</h3><div class="table-responsive"><table class="table tariff-table"><thead><tr><th>Período</th><th>Duração</th><th>% do CIF</th><th>Mínimo</th><th>Cálculo no caso</th><th>Critério vencedor</th></tr></thead><tbody>${perfil
        .map((x, i) => {
          const usado = r.armazenagemDetalhe.periodos[i];
          return `<tr class="${usado ? "applied" : ""}"><td>${i < 2 ? `${i + 1}º período` : "Subsequentes"}</td><td>${x.dias} dias</td><td>${num.format(x.p * 100)}%</td><td>${brl.format(x.min)}</td><td>${usado ? `${brl.format(r.va * x.p)} versus ${brl.format(x.min)} = ${brl.format(usado.valor)}` : "Não alcançado"}</td><td>${usado ? usado.criterio : "—"}</td></tr>`;
        })
        .join(
          "",
        )}</tbody><tfoot><tr><th colspan="4">Total aplicado ao caso</th><th>${brl.format(r.arm)}</th><th></th></tr></tfoot></table></div><h3>Comparação indicativa com Ecoporto</h3>${ecoPrimeiro != null ? `<div class="comparison-terminal"><div><small>DP World — 1º período</small><b>${brl.format(r.armazenagemDetalhe.periodos[0].valor)}</b><span>4 dias; 0,60% do CIF, observado o mínimo</span></div><div><small>Ecoporto — 1º período</small><b>${brl.format(ecoPrimeiro)}</b><span>8 dias; 1,20% do CIF; mínimo ${brl.format(ecoMin)}</span></div></div><p class="explain"><b>Não escolha apenas pelo número:</b> a comparação muda com permanência, CIF, serviço, regime, carga e negociação. Ecoporto oferece período inicial maior; DP World usa períodos menores.</p>` : `<p class="explain">Para LCL, o enunciado não fornece uma tabela Ecoporto completa e diretamente comparável. O sistema evita inventar mínimos ou serviços e recomenda simulação no SEOP do terminal.</p>`}<h3>Serviços complementares que podem aparecer na fatura</h3><div class="optional-services"><div><b>Handling out / carregamento de saída</b><span>Serviço separado em determinadas condições; confirmar valor aplicável.</span></div><div><b>Inspeção não invasiva e escaneamento</b><span>Pode não estar incluída em regimes especiais e deve ser somada se realizada.</span></div><div><b>Posicionamento, pesagem e movimentação interna</b><span>Cobrança depende da solicitação e evento operacional.</span></div><div><b>Gerenciamento de risco</b><span>Pode ser cobrado além da armazenagem.</span></div><div><b>Carga perigosa ou química</b><span>A tabela 2026 prevê condições e adicionais; após 45 dias pode haver acréscimo de 50% na armazenagem.</span></div><div><b>DTA-pátio / despacho sobre águas</b><span>Documentação e prazos específicos; descumprimento pode acionar armazenagem e serviços adicionais.</span></div></div><div class="source-card"><b>Fonte B — tabela pública</b><span>DP World Santos, Landside — Tabela Pública de Serviços janeiro/2026. A própria tabela informa que certos serviços são “sob consulta” e podem excluir handling out, inspeção e gerenciamento de risco. Consulta de referência: 20/07/2026.</span><a href="https://www.dpworld.com/brazil/-/media/project/dpwg/dpwg-tenant/americas/brazil/santos/media-files/tabela-de-precos/2026/janeiro/9111c-landside-tabela-de-precos-janeiro-2026-dp-world.pdf" target="_blank" rel="noopener">Consultar tabela pública</a></div>`;
    }
    const resultados = $("#results").closest(".chapter");
    resultados.parentNode.insertBefore(section, resultados);
  }
  function inserirLaboratorioTributario(c, r) {
    const pct = (v) => num.format(v * 100) + "%";
    const cbsInformativa = r.va * D.tributos.cbs;
    const ibsInformativo = r.va * D.tributos.ibs;
    const etapas = [
      {
        sigla: "II",
        nome: "Imposto de Importação",
        explicacao:
          "É o primeiro imposto do exercício. Sua base é o valor aduaneiro, isto é, mercadoria, frete e seguro convertidos para reais.",
        base: r.va,
        aliquota: c.ii,
        formula: `${brl.format(r.va)} × ${pct(c.ii)}`,
        resultado: r.t.ii,
      },
      {
        sigla: "IPI",
        nome: "Imposto sobre Produtos Industrializados",
        explicacao:
          "No modelo didático da importação, o IPI não usa apenas o valor aduaneiro: primeiro acrescentamos o II calculado na etapa anterior.",
        base: r.va + r.t.ii,
        aliquota: c.ipi,
        formula: `(${brl.format(r.va)} + ${brl.format(r.t.ii)}) × ${pct(c.ipi)}`,
        resultado: r.t.ipi,
      },
      {
        sigla: "PIS-Importação",
        nome: "Contribuição ao PIS na importação",
        explicacao:
          "Nesta simulação simplificada, aplicamos a alíquota hipotética diretamente sobre o valor aduaneiro.",
        base: r.va,
        aliquota: c.pis,
        formula: `${brl.format(r.va)} × ${pct(c.pis)}`,
        resultado: r.t.pis,
      },
      {
        sigla: "Cofins-Importação",
        nome: "Contribuição à Cofins na importação",
        explicacao:
          "Também utiliza o valor aduaneiro no modelo. Uma mercadoria real pode ter adicional ou tratamento específico, por isso a alíquota é editável.",
        base: r.va,
        aliquota: c.cofins,
        formula: `${brl.format(r.va)} × ${pct(c.cofins)}`,
        resultado: r.t.cofins,
      },
      {
        sigla: "ICMS",
        nome: "Imposto estadual calculado por dentro",
        explicacao:
          "O próprio ICMS integra sua base. Primeiro somamos VA, II, IPI, PIS, Cofins, AFRMM e R$ 1.800 de despesas aduaneiras incluídas. Depois dividimos por 1 menos a alíquota.",
        base: r.t.baseIcms,
        aliquota: c.icms,
        formula: `${brl.format(r.t.preliminar)} ÷ (1 − ${pct(c.icms)}) × ${pct(c.icms)}`,
        resultado: r.t.icms,
      },
    ];
    const section = document.createElement("section");
    section.className = "chapter";
    section.innerHTML = `<span class="chapter-tag">LABORATÓRIO TRIBUTÁRIO</span><h2>Como cada alíquota virou dinheiro?</h2><p>Para facilitar o aprendizado, usamos as hipóteses do caso: II ${pct(c.ii)}, IPI ${pct(c.ipi)}, PIS ${pct(c.pis)}, Cofins ${pct(c.cofins)} e ICMS ${pct(c.icms)}. Essas taxas <strong>não são universais</strong>: dependem do NCM, descrição, origem, estado e regime.</p><div class="tax-context"><div><small>NCM usado no exercício</small><b>${c.ncm}</b></div><div><small>Valor aduaneiro</small><b>${brl.format(r.va)}</b></div><div><small>UF hipotética</small><b>São Paulo</b></div><div><small>Câmbio aduaneiro</small><b>R$ ${num.format(r.fx)}/USD</b></div></div><ol class="tax-steps">${etapas.map((x, i) => `<li><div class="tax-heading"><span>${i + 1}</span><div><b>${x.sigla}</b><small>${x.nome}</small></div><strong>${brl.format(x.resultado)}</strong></div><p>${x.explicacao}</p><div class="tax-math"><span>Base: <b>${brl.format(x.base)}</b></span><span>Alíquota hipotética: <b>${pct(x.aliquota)}</b></span><code>${x.formula} = ${brl.format(x.resultado)}</code></div></li>`).join("")}</ol><div class="icms-explained"><h3>Por que o ICMS é “por dentro”?</h3><p>Se aplicássemos simplesmente ${pct(c.icms)} sobre a base preliminar de ${brl.format(r.t.preliminar)}, o imposto ficaria menor. A divisão por <code>1 − ${pct(c.icms)}</code> cria uma base de ${brl.format(r.t.baseIcms)} que já contém o próprio ICMS. Sobre essa base, o resultado é ${brl.format(r.t.icms)}.</p></div><div class="tax-total"><span>Total dos cinco tributos tradicionais do exercício</span><b>${brl.format(r.t.total)}</b></div><h3 class="mt-4">E o AFRMM?</h3><p>${r.afr > 0 ? `Como este caso usa transporte marítimo de longo curso, calculamos 8% sobre o frete aquaviário convertido: <code>${brl.format(r.frete * r.fx)} × 8% = ${brl.format(r.afr)}</code>. Ele entra separadamente e também foi incluído na base preliminar do ICMS deste exercício.` : "Este caso não recebe AFRMM, pois o transporte internacional é aéreo. O adicional é ligado ao transporte aquaviário."}</p><div class="transition-box"><h3>Transição CBS e IBS em 2026</h3><p>Somente para visualização pedagógica, CBS de 0,90% sobre o VA seria ${brl.format(cbsInformativa)} e IBS de 0,10% seria ${brl.format(ibsInformativo)}. Nesta simulação eles <strong>não são adicionados ao TLC</strong>, evitando duplicação com os tributos tradicionais durante o cenário informativo de transição.</p></div><div class="highlight mt-4"><b>Leitura responsável:</b> o cálculo ensina a sequência matemática. Antes de usar essas alíquotas em uma importação, confirme o NCM no simulador oficial, o tratamento administrativo, benefícios, adicional de Cofins, antidumping e a legislação estadual aplicável.</div>`;
    const resultados = $("#results").closest(".chapter");
    resultados.parentNode.insertBefore(section, resultados);
  }
  function inserirGlossario() {
    const siglas = [
      [
        "RT",
        "Revenue Ton ou tonelada de receita",
        "Unidade usada na cobrança LCL. No critério W/M, 1 RT corresponde a 1 m³ ou 1 tonelada, adotando-se o que gerar a maior cobrança. Uma carga de 5 m³ e 750 kg possui 5 RT porque 5 m³ é maior que 0,75 tonelada.",
      ],
      [
        "W/M",
        "Weight or Measure",
        "Peso ou medida. É a comparação entre o peso em toneladas e o volume em metros cúbicos usada para encontrar a quantidade tarifável no LCL.",
      ],
      [
        "LCL",
        "Less than Container Load",
        "Carga menor que um contêiner. Mercadorias de vários embarcadores dividem o mesmo equipamento.",
      ],
      [
        "FCL",
        "Full Container Load",
        "Contêiner contratado para uma única carga ou embarcador, mesmo que não esteja fisicamente cheio.",
      ],
      [
        "CFS",
        "Container Freight Station",
        "Recinto onde cargas LCL são recebidas, consolidadas, desconsolidadas e entregues.",
      ],
      [
        "THC",
        "Terminal Handling Charge",
        "Cobrança de movimentação do contêiner ou carga no terminal de origem ou destino.",
      ],
      [
        "AWB",
        "Air Waybill",
        "Conhecimento de transporte aéreo. Identifica a carga, rota e partes da operação; pode gerar tarifa de emissão.",
      ],
      [
        "VGM",
        "Verified Gross Mass",
        "Massa bruta verificada do contêiner, exigida antes do embarque marítimo.",
      ],
      [
        "AFRMM",
        "Adicional ao Frete para Renovação da Marinha Mercante",
        "Adicional calculado sobre a remuneração aquaviária. No exercício, aplica-se 8% ao longo curso e nunca ao aéreo ou rodoviário.",
      ],
      [
        "NCM",
        "Nomenclatura Comum do Mercosul",
        "Código fiscal da mercadoria. Influencia tributos, licenças, controles e tratamento administrativo.",
      ],
      [
        "CIF",
        "Cost, Insurance and Freight",
        "Pode nomear o Incoterm marítimo e também aparecer como referência de valor com mercadoria, seguro e frete. O contexto precisa ser observado.",
      ],
      [
        "FOB",
        "Free on Board",
        "Incoterm aquaviário em que o vendedor entrega a mercadoria a bordo no porto de embarque. Nos casos, o valor FOB é o ponto comercial de partida.",
      ],
      [
        "GRIS",
        "Gerenciamento de Risco",
        "Parcela do transporte rodoviário associada a medidas de prevenção de roubo e gerenciamento da operação.",
      ],
      [
        "Free time",
        "Prazo livre",
        "Quantidade de dias sem cobrança de demurrage ou detention, conforme contrato e equipamento.",
      ],
      [
        "Demurrage",
        "Sobre-estadia no terminal",
        "Cobrança quando o contêiner permanece no terminal além do free time.",
      ],
      [
        "Detention",
        "Sobre-estadia fora do terminal",
        "Cobrança quando o equipamento sai do terminal, mas não é devolvido dentro do prazo livre.",
      ],
      [
        "TLC",
        "Total Landed Cost",
        "Custo total da mercadoria posta no destino, incluindo compra, logística, tributos, terminal, aduana, transporte e custos financeiros.",
      ],
    ];
    const section = document.createElement("section");
    section.className = "chapter";
    section.innerHTML = `<span class="chapter-tag">GLOSSÁRIO PARA INICIANTES</span><h2>O que significam as siglas desta história?</h2><p>Comércio exterior usa muitas abreviações. Consulte esta lista sempre que uma expressão aparecer no cálculo.</p><div class="glossary">${siglas.map(([s, n, e]) => `<details ${s === "RT" ? "open" : ""}><summary><b>${s}</b><span>${n}</span></summary><p>${e}</p></details>`).join("")}</div>`;
    const perguntas = $("#questions").closest(".chapter");
    perguntas.parentNode.insertBefore(section, perguntas);
  }
  function render() {
    const id = Number(document.body.dataset.case),
      c = CASOS.find((x) => x.id === id),
      h = H[id],
      r = calc(c);
    document.title = `Caso ${id} — ${c.titulo}`;
    $("#caseNo").textContent = id;
    $("#title").textContent = c.titulo;
    $("#subtitle").textContent = c.descricao;
    $("#route").innerHTML = [c.origem, c.portoOrigem, c.portoDestino, c.destino]
      .map(
        (x, i) =>
          (i ? '<i class="bi bi-arrow-right"></i>' : "") + `<span>${x}</span>`,
      )
      .join("");
    $("#opening").innerHTML =
      `<p>${h[0]}</p><p>${c.descricao} segue de <strong>${c.portoOrigem}</strong> para <strong>${c.portoDestino}</strong>, com entrega final em ${c.destino}. ${h[1]}</p>`;
    const facts = [
      ["Produto", c.descricao],
      ["Quantidade", num.format(c.quantidade) + " " + c.unidade],
      ["Peso bruto", num.format(c.pesoBruto) + " kg"],
      ["Volume", num.format(c.volume) + " m³"],
      ["Incoterm", c.incoterm],
      ["FOB", usd.format(c.fob)],
    ];
    $("#facts").innerHTML = facts
      .map(
        (x) => `<div class="fact"><small>${x[0]}</small><b>${x[1]}</b></div>`,
      )
      .join("");
    $("#steps").innerHTML = steps(id, c, r)
      .map(
        (x) =>
          `<li><h3>${x.title}</h3><p>${x.text}</p><div class="calc"><code>${x.formula}</code></div><div class="explain"><b>Por que este passo existe?</b> Porque seu resultado será usado na decisão ou na próxima etapa do cálculo.</div></li>`,
      )
      .join("");
    inserirPlanilha(id, c, r);
    inserirPainelTerminal(c, r);
    inserirLaboratorioTributario(c, r);
    inserirGlossario();
    const results = [
      ["Frete internacional", usd.format(r.frete)],
      ["Valor aduaneiro", brl.format(r.va)],
      ["AFRMM", brl.format(r.afr)],
      ["Tributos", brl.format(r.t.total)],
      ["Armazenagem", brl.format(r.arm)],
      ["TLC", brl.format(r.tlc), "primary"],
      ["Por unidade", brl.format(r.tlc / Math.max(1, c.quantidade))],
      ["Por kg", brl.format(r.tlc / Math.max(1, c.pesoBruto))],
      ["Por m³", brl.format(r.tlc / Math.max(0.001, c.volume))],
    ];
    $("#results").innerHTML = results
      .map(
        (x) =>
          `<div class="result ${x[2] || ""}"><small>${x[0]}</small><b>${x[1]}</b></div>`,
      )
      .join("");
    $("#decision").textContent = h[1];
    $("#lessons").innerHTML = h[2]
      .map(
        (x, i) =>
          `<div class="lesson"><b>Ponto ${i + 1}</b><span>${x}</span></div>`,
      )
      .join("");
    $("#questions").innerHTML = c.perguntas
      .map((x) => `<li>${x}</li>`)
      .join("");
  }
  document.addEventListener("DOMContentLoaded", render);
})();
