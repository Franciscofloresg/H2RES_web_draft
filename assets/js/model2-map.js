/*
 * H2RES 2.0 — interactive model map data.
 * Descriptions and equations are transcribed from the model's own
 * documentation (docs/MODEL.md and README.md of the H2RES_2.0_release).
 * Variable / constraint names match the names used in the Gurobi model.
 * Equations are a curated SELECTION, not the full formulation.
 */
window.H2RES_MODEL2 = {
  meta: {
    name: "H2RES 2.0",
    tagline: "A coupled four-sector energy-system planning model, solved together as one linear program.",
    docsUrl: "https://github.com/H2RES-model",
    note: "Equations below are transcribed from docs/MODEL.md and are a curated subset. Names match the Gurobi variables and constraints."
  },

  // Coupling edges between the four sectors (docs/MODEL.md §6).
  edges: [
    { from: "heat", to: "power", label: "heat pumps / e-boilers draw q_out / COP" },
    { from: "efuel", to: "power", label: "converters & pipeline pumping draw electricity" },
    { from: "transport", to: "power", label: "charging draws · V2G returns" },
    { from: "heat", to: "efuel", label: "e-fuel boilers draw q_out / η" },
    { from: "transport", to: "efuel", label: "carrier fleets draw their energy need" },
    { from: "power", to: "heat", label: "CHP: one unit, two outputs, one region", dashed: true }
  ],

  modules: {
    core: {
      label: "Objective & Investment",
      group: "core",
      short: "The frame that prices and links every sector.",
      blurb: [
        "H2RES 2.0 is a linear program that chooses capacity to build and how to operate it, over a set of milestone years, so that the discounted total cost of serving demand is minimised. Everything is continuous — no on/off decisions, no minimum load, no start-up costs — which buys the ability to solve many hours, several sectors and several decades at once, and gives every constraint a shadow price.",
        "Investment enters as an annuity: capacity is paid for over its life through the capital recovery factor. Each vintage keeps the capital cost of the year it was built, so learning rates or explicit cost trajectories can make later vintages cheaper. Survival of each vintage follows a straight-line decline between decom_start and lifetime."
      ],
      tech: ["Milestone years & discounting", "Annuitised capex (CRF)", "Vintages & straight-line survival", "Exogenous learning rates", "σ pro-rating of a solved slice"],
      equations: [
        { name: "Objective", tex: "\\min \\; \\sum_{y} w_y \\Big[ \\sum_{\\text{sectors}} \\big( C^{\\mathrm{op}}\\,\\Delta t + C^{\\mathrm{inv}}\\,\\sigma \\big) + C^{\\mathrm{carbon}} + C^{\\mathrm{curt}} \\Big]", note: "The model minimises the discounted total cost of serving demand across all milestone years. Every term is weighted by w_y and discounted back to the first year of the horizon. Operating terms accumulate over time and so are multiplied by Δt; investment terms are pro-rated to the solved slice by σ = |T|·dt / 8760, and a carbon price and a curtailment penalty enter as additional policy terms." },
        { name: "Capital recovery factor", tex: "\\mathrm{CRF}(r,n) = \\frac{r\\,(1+r)^{n}}{(1+r)^{n} - 1}", note: "Investment is annuitised rather than charged as a lump sum: a unit's capital cost is spread over its economic life n at the discount rate r, so a MW built this year is paid for gradually across the years it operates. When r = 0 the factor collapses to a straight-line 1/n." },
        { name: "Capacity from surviving vintages", tex: "\\mathrm{capacity}(u,y) = \\mathrm{existing}(u,y) + \\sum_{y' \\le y} \\mathrm{surv}(u,y',y)\\, \\mathrm{cap}^{G}_{u,y'}", note: "cap_G[u,y] is what is BUILT in year y, not the stock in service. The capacity available in a year is the sum of every surviving earlier vintage plus what already existed, where survival follows a straight-line decline between the ages decom_start and lifetime. Because each vintage keeps the capital cost of the year it was built, the capex term is summed over build years rather than multiplying total capacity." },
        { name: "Exogenous learning", tex: "\\mathrm{capex}(y) = \\max\\!\\big( \\mathrm{capex}_{\\mathrm{ref}} (1-\\rho)^{\\,y - y_0},\\; \\phi \\cdot \\mathrm{capex}_{\\mathrm{ref}} \\big)", note: "Two optional files set how capital cost falls over the horizon: learning_rates.csv gives a decline rate ρ per technology — or per named unit, which wins — bounded below by a floor φ, and capital_cost_by_year.csv can override with an explicit € trajectory. The learning is exogenous: there is no feedback from how much the model builds to what the next unit costs, which would make the problem non-convex." }
      ],
      assumptions: ["Storage is not linked between years: every store starts and ends each year half full, so years pass capacity but not energy.", "Learning is exogenous — no feedback from how much is built to the next unit's cost."]
    },

    power: {
      label: "Power",
      group: "sector",
      short: "Electricity: thermal, VRE and hydro, storage and transmission.",
      blurb: [
        "The power sector covers thermal, wind, solar and hydro generation, reservoirs and pumped hydro, batteries, and transmission between zones. Power is the one sector that is always required, because every other sector connects to it.",
        "The electricity balance holds at each bus and hour; its dual is the electricity price there. Lines use a transport (net-transfer-capacity) representation — bounded flow in both directions, no impedance and no losses. Reservoirs are stores the weather fills for free, with spill so a full reservoir can pass water it cannot use."
      ],
      tech: ["Thermal (with ramping)", "Wind / Solar / Run-of-river (hourly profile)", "Reservoir hydro (HDAM)", "Pumped hydro — open & closed loop", "Batteries", "Transmission (NTC)"],
      equations: [
        { name: "Electricity balance", tex: "\\sum_u p^{\\mathrm{out}}_{u} + \\sum_s p^{\\mathrm{dis}}_{s} - \\sum_s p^{\\mathrm{ch}}_{s} + \\mathrm{ens}_b + \\!\\!\\sum_{\\ell \\to b}\\!\\! f_{\\ell} - \\!\\!\\sum_{b \\to \\ell}\\!\\! f_{\\ell} - L^{\\mathrm{heat}}_b - L^{\\mathrm{efuel}}_b - L^{\\mathrm{tr}}_b = d_b", note: "One balance per electricity bus and hour (balance[b,t,y]). Generation plus storage discharge, minus charging, plus net line inflows and the unserved-energy slack, minus the electricity load drawn by heat, e-fuels and transport, must equal demand. Its dual is the electricity price at that bus and hour, and lines use a transport representation — flow bounded both ways, with no impedance and no losses." },
        { name: "Generation limit", tex: "p^{\\mathrm{out}}_{u,t,y} \\le \\mathrm{capacity}(u,y)\\, \\cdot a_{u,t,y}", note: "Each unit's output is capped by its in-service capacity times an availability factor (cap_gen[u,t,y]). For wind, solar and run-of-river that factor is the hourly profile; for everything else it is the static cap_factor. A unit that has an hourly profile ignores any cap_factor, which would otherwise derate it twice, with a warning." },
        { name: "Ramping (thermal / biomass / CHP)", tex: "p^{\\mathrm{out}}_{u,t} - p^{\\mathrm{out}}_{u,t-1} \\le r^{\\mathrm{up}}_u \\cdot \\mathrm{capacity}(u,y)", note: "Thermal, biomass and CHP units that declare a rate are limited in how fast they change output between consecutive hours, up (ramp_up) and down (ramp_dn). The first hour of each year is left unconstrained because there is no wrap-around to the previous hour." },
        { name: "Storage state of charge", tex: "\\mathrm{soc}_{s,t} = (1-\\lambda_s)\\,\\mathrm{soc}_{s,t-1} + \\eta^{\\mathrm{ch}}_s\\, p^{\\mathrm{ch}}_{s,t}\\, \\Delta t - \\frac{p^{\\mathrm{dis}}_{s,t}\\, \\Delta t}{\\eta^{\\mathrm{dis}}_s}", note: "The state of charge evolves with a standby loss and separate charge and discharge efficiencies (soc_bal). Storage is sized in MWh and the charge/discharge power follows from duration ratios, so investing in energy also buys the power to use it. Every store starts and ends the year half full (soc_cyc), which is also why the minimum state of charge is written as a share rather than an absolute MWh." },
        { name: "Reservoir hydro", tex: "\\mathrm{soc}_{s,t} = (1-\\lambda_s)\\,\\mathrm{soc}_{s,t-1} + \\eta^{\\mathrm{ch}}_s p^{\\mathrm{ch}}_{s,t}\\Delta t - \\frac{p^{\\mathrm{out}}_{s,t}\\Delta t}{\\eta^{\\mathrm{dis}}_s} + \\mathrm{inflow}_{s,t} - \\mathrm{spill}_{s,t}", note: "A reservoir is a store the weather fills for free (res_bal): inflow is added and spill lets a full reservoir pass water it cannot use — without it, a wet year would be infeasible. Pumped hydro adds a separate pump rating, and a closed-loop scheme also tracks a lower basin (soc_lo) whose zero floor stops it pumping water it has not previously generated with." },
        { name: "Emissions cap", tex: "\\mathrm{CO_2}(y) \\le \\sigma \\cdot \\overline{\\mathrm{CO_2}}_{\\,y}", note: "Annual CO₂ — summed over power, heat, e-fuels and transport, net of sequestration — is held under a cap that is pro-rated to the solved slice by σ (co2_cap). A renewable-generation target (res_target) and a curtailment cap (curt_cap) apply the same way; the RES target is a hard constraint with no price attached, so an unreachable target makes the run infeasible rather than merely expensive." }
      ],
      assumptions: ["Transport representation of lines: no impedance, no losses.", "Continuous LP: no unit commitment, minimum load or start-up costs."]
    },

    heat: {
      label: "Heat",
      group: "sector",
      short: "District, industrial and building heat, plus CHP.",
      blurb: [
        "Heat is modelled per heat bus — a district-heating network, an industrial steam host, a building stock. Technologies are sorted by where their energy comes from: electric converters (draw q_out / COP from the power balance), e-fuel boilers (draw q_out / η from a carrier balance), fuel boilers (pay a €/MWh price) and CHP (a power-sector unit with a heat output).",
        "A heat pump and an electric boiler are the same object with a different number — a COP above 1, or a fraction below 1. Distribution losses multiply what is put INTO the network, so a 12 % loss needs about 14 % more production than the demand served."
      ],
      tech: ["Heat pumps & electric boilers (COP)", "E-fuel boilers", "Fuel boilers", "CHP — back-pressure & extraction", "Thermal storage (TES)"],
      equations: [
        { name: "Heat balance", tex: "\\Big( \\sum q^{\\mathrm{out}} + \\sum (\\mathrm{TES}^{\\mathrm{dis}} - \\mathrm{TES}^{\\mathrm{ch}}) + \\sum q^{\\mathrm{chp}} \\Big)(1 - \\ell_{\\mathrm{dist}}) + \\mathrm{ens}^{h} = d^{h}", note: "One balance per heat bus (heat_balance[b,t,y]): converter output, net thermal-storage flow and CHP heat, scaled by one minus the distribution loss, plus the unserved-heat slack, meet demand. The loss multiplies what is put INTO the network, so a 12 % loss needs about 14 % more production than the demand served; the unserved-heat slack sits outside the factor because a shortfall is measured at the consumer, not at the plant, and each bus can override the value of lost load (voll_heat)." },
        { name: "CHP — back-pressure", tex: "p^{\\mathrm{out}} = c_m\\, q^{\\mathrm{chp}}", note: "In a back-pressure machine all steam passes through the turbine and leaves at the pressure the network needs, so heat and power are rigidly linked along a single line — one degree of freedom (chp_backpressure). c_m is electricity per unit of heat (MWh_el / MWh_heat), the same convention as Dispa-SET's CHPPowerToHeat and PyPSA's c_m, so a value can be copied from either." },
        { name: "CHP — extraction region", tex: "p^{\\mathrm{out}} \\ge c_m\\, q^{\\mathrm{chp}}, \\quad q^{\\mathrm{chp}} \\le \\overline{q}, \\quad p^{\\mathrm{out}} + \\beta\\, q^{\\mathrm{chp}} \\le \\mathrm{capacity}", note: "An extraction/condensing turbine has two degrees of freedom — how hard to fire and how much to extract — so its feasible region is an area with three edges: the maximum heat-per-power line, the heat side's own rating, and the iso-fuel line where β MW of electricity are given up per MW of heat at constant fuel. The extracted heat is charged for its fuel in both the cost and emission terms, so extraction heat is never free." }
      ],
      assumptions: ["No minimum load / unit commitment, so the CHP operating region has no lower edge.", "Power-to-heat is a heat converter with a COP, not a CHP type."]
    },

    efuel: {
      label: "E-fuels & feedstocks",
      group: "sector",
      short: "H₂, NH₃, methanol, methane, CO₂, N₂ — conversion, storage, trade.",
      blurb: [
        "This sector balances as many carriers as the case defines — hydrogen, ammonia, methanol, methane, CO₂, nitrogen. Each carrier has its own buses, and each bus its own balance whose dual is that carrier's price.",
        "Converters turn inputs into one output at fixed ratios (electrolyser: electricity → hydrogen; DAC: electricity + heat → CO₂; synthesis: hydrogen + CO₂ → methanol). Electricity inputs are peeled off to the power balance; the rest stay inside the sector. Stores hold a carrier between hours; external trade buys/sells across the boundary; transport links move a carrier between internal buses, losing a fraction per km."
      ],
      tech: ["Electrolysers", "Air separation (ASU)", "Direct air capture (DAC)", "Synthesis & methanation", "Carrier storage", "External trade & pipelines", "CO₂ removal (geological)"],
      equations: [
        { name: "Carrier balance", tex: "\\underbrace{p^{\\mathrm{ef}} + \\mathrm{dis} + \\eta^{\\mathrm{imp}}\\mathrm{imp} + \\eta^{\\mathrm{link}}\\mathrm{in} + \\mathrm{ens}}_{\\text{supply}} = \\underbrace{\\mathrm{feed} + \\mathrm{ch} + \\mathrm{exp} + \\mathrm{out} + D^{\\mathrm{sec}} + D^{\\mathrm{exo}} + \\mathrm{surplus}}_{\\text{use}}", note: "One balance per carrier bus (ef_balance[b,c,t,y]). Converter output, storage discharge, imports and internal-link inflows — each taken net of its delivery loss — and the unserved slack meet feedstock draw, storage charge, exports, outflows, an exogenous demand, the surplus slack, and D^sec: the coupling term that collects e-fuel-fired heat and power, the extraction-CHP top-up, carrier-fuelled fleets and CO₂ sent to storage. Its dual is that carrier's price." },
        { name: "Converter capacity", tex: "p^{\\mathrm{ef}}_{u,t,y} \\le \\mathrm{cap\\_factor} \\cdot \\mathrm{capacity}(u,y)", note: "A converter's throughput is limited by its cap_factor times built capacity (ef_avail). Trade routes and internal links carry two limits — an hourly one that a peak factor lets exceed the average (a shipping route delivers a cargo at a time, not a trickle) and an annual one that it does not — and a pressure uplift can buy extra pipeline throughput by compression at its own capital cost. Import and export share one bidirectional capacity." },
        { name: "CO₂ removal", tex: "\\mathrm{CO_2^{net}}(y) = \\mathrm{emissions}(y) - \\mathrm{sequestered}(y), \\qquad \\mathrm{seq}(y) \\le \\overline{\\mathrm{seq}}_{\\,y}", note: "Where a case models a CO₂ carrier, a sink can take CO₂ off the balance into permanent geological storage: it sits on the demand side of the CO₂ balance, is subtracted from net emissions, is charged a €/tonne sequestration cost and can be capped by an annual storage limit. CO₂ that was only 'supplied' by the unserved-energy slack is added back as an emission, so sequestering CO₂ that was never captured earns nothing." }
      ],
      assumptions: ["A unit naming a carrier the model does not produce stops the run rather than burning free fuel.", "Unserved carrier demand priced at VOLL (default 3000 €/MWh); surplus penalised far lower."]
    },

    transport: {
      label: "Transport",
      group: "sector",
      short: "Vehicle fleets meeting mobility demand; smart, dumb and V2G charging.",
      blurb: [
        "Transport works on two clocks. The service clock is annual and exogenous: pathway.csv says how many vehicles of each technology exist each year and what share of the mode's activity they serve — the model does not choose the fleet mix, it prices it. The energy clock is hourly and endogenous: how much a fleet drives is fixed by mobility demand, but WHEN it charges is what the model decides.",
        "charging_mode decides what the model may do: none (does not plug in), dumb (a fixed load shape spread by how many vehicles are plugged in), v1g (controlled charging) and v2g (controlled charging plus discharge back to the grid). Driving is a parameter, not a decision — the energy need leaves the battery whether or not it is convenient."
      ],
      tech: ["ICE / fuel-cell fleets (none)", "Uncontrolled charging (dumb)", "Smart charging (v1g)", "Vehicle-to-grid (v2g)", "Carrier-fuelled fleets"],
      equations: [
        { name: "Energy need of a fleet", tex: "e_{f,t,y} = \\frac{\\mathrm{activity}(m,t,y)\\, \\cdot \\theta_{f,y}}{\\phi_f}", note: "A fleet exists to deliver mobility, and its hourly energy need is the mode's activity times the fleet's share θ, divided by its efficiency φ (activity per MWh at the vehicle). The service side is annual and exogenous — you supply the pathway and the model prices it — while when the fleet charges is the endogenous decision." },
        { name: "Fleet state of charge", tex: "\\mathrm{soc}_{f,t} = (1-\\lambda)\\mathrm{soc}_{f,t-1} + \\eta^{\\mathrm{ch}} p^{\\mathrm{ch}}\\Delta t - \\frac{p^{\\mathrm{dis}}\\Delta t}{\\eta^{\\mathrm{dis}}} - e_{f,t,y} + \\mathrm{ens}", note: "For controlled fleets the battery's state of charge tracks charging, discharging and the driving energy that leaves it each hour whether convenient or not, with an unmet-mobility slack (tr_soc_bal). A minimum state of charge keeps the range drivers insist on, and v2g adds discharge back to the grid (tr_v2g) gated by the share of willing bidirectional vehicles." },
        { name: "Plug-in limit", tex: "p^{\\mathrm{ch}}_{f,t} \\le \\mathrm{connection}(f,t,y)\\, \\cdot P^{\\mathrm{ch}} \\cdot N_{f,y}", note: "The model can only charge vehicles that are at a charge point in that hour: charging power is bounded by the plugged-in fraction times the per-vehicle charger rating times the fleet size (tr_plug). This is what stops the optimiser from charging the whole fleet in the single cheapest hour." }
      ],
      assumptions: ["Vehicle capital cost is reported but left out of the objective (the model cannot change the fleet mix).", "soc_min keeps the range drivers insist on; v2g_share gates who will actually discharge."]
    },

    coupling: {
      label: "Sector coupling",
      group: "link",
      short: "How the four sectors are joined into one program.",
      blurb: [
        "Solving the sectors together is the point. A heat pump is a heat technology and an electricity load; an electrolyser turns cheap wind into hydrogen a boiler burns and a truck drives on; a parked electric car is either a problem or a battery. Each decision changes the others, so the model takes them at the same time.",
        "Every sector writes into the same Gurobi model in an order that guarantees a variable exists before anything refers to it: all sectors declare variables; heat adds constraints (it needs the power sector's p_out for the CHP region); transport next; e-fuels, having collected fuel demand from heat, power and transport; and power adds its balance last, subtracting the electricity load of the other three."
      ],
      tech: ["Heat → Power (COP)", "E-fuels → Power (converters, pumping)", "Transport → Power (charging, V2G)", "Heat → E-fuels (boilers)", "Transport → E-fuels (carrier fleets)", "Power ↔ Heat (CHP)"],
      equations: [
        { name: "The coupling is ordinary variables", tex: "L^{\\mathrm{heat}}_b = \\sum_{u \\in \\text{HP},\\, b} \\frac{q^{\\mathrm{out}}_u}{\\mathrm{COP}_u} \\;\\;+\\;\\; \\dots", note: "The couplings are ordinary variables referenced across files, not placeholder variables edited after the fact. The electricity load a bus sees is the sum of every heat pump and electric boiler drawing q_out/COP, every e-fuel converter and pipeline pump, and every charging fleet (with V2G returning power) — all subtracted when the power balance is written last. Where a sector depends on another that is not loaded, the model raises rather than quietly producing a cheaper answer." }
      ],
      assumptions: ["Where a sector depends on another that is not loaded, the model raises instead of quietly producing a cheaper answer."]
    },

    policies: {
      label: "Policies & Investment",
      group: "core",
      short: "System-wide prices and constraints that shape the whole optimisation.",
      blurb: [
        "Beyond the per-sector balances, a handful of system-wide terms steer the result: a carbon price and cap, a renewable-generation target, a curtailment penalty and cap, the value of lost load, and a CO₂ sequestration option. They enter either as extra terms in the single objective or as hard constraints across all sectors.",
        "Prices are added to the objective (weighted by w_y and pro-rated by σ to the solved slice); targets are hard constraints with no price — an unreachable target makes the run infeasible rather than merely expensive."
      ],
      tech: ["CO₂ price & cap", "RES target", "Curtailment penalty & cap", "Value of lost load (VOLL)", "CO₂ sequestration / DAC"],
      equations: [
        { name: "Carbon price (objective term)", tex: "C^{\\mathrm{carbon}} = w_y \\cdot \\mathrm{price}^{\\mathrm{CO_2}} \\cdot \\mathrm{co2}[y]", note: "A carbon price adds w_y · price · co2[y] to the objective — the same weighting and discounting as every other cost term. It prices annual emissions rather than capping them; a price and a cap can be used together or on their own." },
        { name: "Emissions definition & cap", tex: "\\mathrm{co2}[y] = \\!\\!\\sum_{\\text{sectors}}\\!\\! \\mathrm{intensity}\\cdot \\mathrm{output}\\cdot \\Delta t \\;-\\; \\mathrm{sequestered} \\;\\le\\; \\sigma \\cdot \\overline{\\mathrm{CO_2}}_{\\,y}", note: "Annual CO₂ (co2_def) sums emission intensity times output over power, heat, e-fuels and transport — including the fuel burned by extraction-CHP heat — net of any sequestered CO₂. co2_cap holds it under an annual cap pro-rated to the solved slice by σ." },
        { name: "Curtailment penalty & cap", tex: "\\mathrm{curt}[y] = \\!\\!\\sum_{u\\in \\mathrm{VRE}}\\!\\! (\\mathrm{available}-\\mathrm{produced})\\,\\Delta t, \\qquad C^{\\mathrm{curt}} = w_y\\cdot \\mathrm{price}\\cdot \\mathrm{curt}[y]", note: "Curtailment (curt_def) is the VRE energy that was available but not produced. A curtailment price adds w_y · price · curt[y] to the objective, and a curtailment cap (curt_cap) can also bound it as a fraction of total generation." },
        { name: "Renewable-generation target", tex: "\\sum_{u\\in \\mathrm{RES}} \\mathrm{output} \\;\\ge\\; \\tau \\cdot \\text{total generation}", note: "The RES target (res_target) requires renewable generation to be at least a share τ of total generation. It is a hard constraint with no price attached, so an unreachable target makes the run infeasible rather than merely expensive." },
        { name: "Value of lost load (VOLL)", tex: "C^{\\mathrm{ens}} = \\mathrm{VOLL} \\cdot \\mathrm{ens}", note: "Unserved energy is priced at the value of lost load (3000 €/MWh by default), a run-wide figure any bus may override with its own voll (e.g. voll_heat) — unserved heat in a hospital district and low-grade industrial heat are not worth the same. It is the slack that keeps the model feasible when demand cannot be met." },
        { name: "CO₂ sequestration", tex: "\\mathrm{seq}[y] \\le \\overline{\\mathrm{seq}}_{\\,y}, \\qquad \\mathrm{cost} = \\mathrm{price}^{\\mathrm{seq}} \\cdot \\mathrm{seq}[y]", note: "Where a case models a CO₂ carrier, captured CO₂ (e.g. from DAC) can be sent to permanent storage: it is subtracted from net emissions, charged a €/tonne sequestration cost, and capped by an annual storage limit. CO₂ only 'supplied' by the unserved-energy slack is added back as an emission, so sequestering CO₂ that was never captured earns nothing." }
      ],
      assumptions: ["Targets (RES) are hard constraints; prices (carbon, curtailment) are objective terms — the two behave differently when a limit binds.", "A single objective and one shared set of balances mean these terms trade off against every investment and dispatch decision at once."]
    },

    network: {
      label: "Network & zones",
      group: "link",
      short: "How multiple buses, zones or systems are linked into one model.",
      blurb: [
        "There is no separate 'zone' object: every carrier is balanced per bus and hour, and a zone is simply a set of buses. Zones are coupled only through what connects their buses — electricity transmission lines, carrier pipelines, and external trade routes. The same model solves one node or many; adding a zone means adding its buses and the links that reach it.",
        "Electricity lines use a transport (net transfer capacity) representation — a bounded flow with no impedance and no losses — which keeps the multi-zone problem linear and fast. Carrier routes (e.g. H₂ pipelines) and external trade carry their own hourly and annual limits, and a pipeline can pay to compress for extra throughput."
      ],
      tech: ["Per-bus / per-zone balances", "Transmission lines (transport model)", "H₂ & carrier pipelines", "External trade routes", "Compression uplift"],
      equations: [
        { name: "One balance per bus / zone", tex: "\\text{balance}[b,t,y]: \\;\\; \\sum \\mathrm{supply}_b - \\sum \\mathrm{load}_b + \\!\\!\\sum_{\\ell \\to b}\\!\\! f_\\ell - \\!\\!\\sum_{b \\to \\ell}\\!\\! f_\\ell = d_b", note: "Every carrier is balanced per bus and hour — one electricity balance per electricity bus, one heat balance per heat bus, one carrier balance per e-fuel bus. A 'zone' is just a set of buses; zones are coupled only through the lines, pipelines and trade routes that join their buses. Each balance's dual is that carrier's price at that place and hour." },
        { name: "Transmission line (transport model)", tex: "-\\,\\overline{f}_\\ell \\;\\le\\; f_{\\ell,t,y} \\;\\le\\; \\overline{f}_\\ell", note: "Electricity lines are a transport (net transfer capacity) representation: flow f is bounded by the line's capacity in both directions, with no impedance and no losses. Positive flow runs from→to, and the same flow appears as an inflow at one bus and an outflow at the other, coupling the two zones' balances." },
        { name: "Carrier pipelines & external trade", tex: "\\mathrm{imp} + \\mathrm{exp} \\;\\le\\; \\mathrm{peak}\\cdot \\overline{F} + \\mathrm{uplift}, \\qquad \\overline{\\mathrm{imp}+\\mathrm{exp}}^{\\;\\text{annual}} \\;\\le\\; \\overline{F} + \\mathrm{uplift}", note: "H₂ pipelines and other carrier routes carry two limits — an hourly one that a peak factor lets exceed the average (a shipping cargo arrives at once, not as a trickle) and an annual average one that it does not. Import and export share one bidirectional capacity; a pipeline can buy extra throughput by compression (uplift) at its own capital cost, and imports arrive net of the route loss." }
      ],
      assumptions: ["Lines have no impedance and no losses — a transport model, not a DC or AC power flow.", "A zone is an emergent grouping of buses; nothing in the model enforces zone boundaries beyond the links you define."]
    },

    demand: {
      label: "Final demand",
      group: "link",
      short: "Demand is an exogenous input, met as the right-hand side of each balance.",
      blurb: [
        "The final-demand sectors — buildings, industry and other end uses — are not optimised. Their demand is an input you supply, and it enters the model as the right-hand side of each carrier's balance: the electricity balance must meet electricity demand, the heat balance must meet heat demand, and e-fuel balances meet an exogenous carrier demand. There are no separate 'building' or 'industry' equations; the equation that governs them is the balance that has to serve them.",
        "Transport is the one demand that is modelled explicitly, because when a fleet charges is a decision, not an input — so it has its own sector page. Where any demand cannot be met, an unserved-energy slack absorbs the shortfall at the value of lost load."
      ],
      tech: ["Electricity demand", "Heat demand", "E-fuel / feedstock demand", "Exports", "Unserved-energy slack (VOLL)"],
      equations: [
        { name: "Demand is the balance RHS", tex: "\\underbrace{\\textstyle\\sum \\mathrm{supply} - \\sum \\mathrm{load} + \\text{(net imports)}}_{\\text{decided by the model}} \\;+\\; \\mathrm{ens} \\;=\\; \\underbrace{d}_{\\text{exogenous demand}}", note: "For every carrier and hour, what the model supplies (net of internal loads and imports) plus the unserved-energy slack must equal the demand d you provide. d is not a variable — it is read from the demand files — so the 'final demand' sectors have no equations of their own; they set the target the sector balances (see Power, Heat and E-fuels) are written to hit." }
      ],
      assumptions: ["Demand is exogenous — the model prices meeting it, it does not choose how much is demanded (transport charging timing is the exception).", "Unmet demand is not infeasible: it is priced at the value of lost load, so a result may include a small, deliberate shortfall."]
    },

    solve: {
      label: "Solve modes",
      group: "core",
      short: "Perfect foresight vs rolling horizon.",
      blurb: [
        "CoupledModel solves every milestone year together with perfect foresight — the model in 2030 already knows what 2050 will need. That is the standard capacity-expansion assumption and gives a lower bound on cost.",
        "RollingHorizonModel is the alternative: it solves the years in blocks, each seeing only its own window and whatever the previous block built. The answer is more expensive and more realistic. Running both is a cheap way to find how much of a result depends on the foresight assumption."
      ],
      tech: ["CoupledModel — perfect foresight", "RollingHorizonModel — myopic blocks"],
      equations: [],
      assumptions: ["A falling cost path makes it worth waiting to invest; perfect foresight delays optimally, rolling horizon cannot — so cost paths widen the gap between the two."]
    },

    limitations: {
      label: "Assumptions & limitations",
      group: "core",
      short: "The boundaries of what the model claims — structural, per-sector and data caveats.",
      blurb: [
        "Every model simplifies. This page lists the simplifications in H2RES 2.0 that could change how you read a result, so you meet them here rather than in a review. Nothing here is a defect; these are the boundaries of what the model claims, transcribed from docs/LIMITATIONS.md.",
        "They are grouped by how likely they are to matter: structural assumptions true of the whole model, then sector-by-sector caveats, then data traps that can silently change an answer, and finally the cases the loaders refuse to guess about and raise or warn on instead."
      ],
      tech: ["Structural", "Power", "Heat", "E-fuels", "Transport", "Data traps", "Model guardrails"],
      equations: [],
      assumptions: [
        "Structural — It is a linear program: no unit commitment, no minimum load, no start-up costs, no integer capacity blocks. A plant can run at 3 % of capacity for one hour at no penalty and capacity is built in arbitrarily small increments, so short-run flexibility looks cheaper than it is — thermal plants cycle more freely than a real system allows. The gain is that four sectors, several thousand hours and several decades solve in reasonable time, and every constraint has a shadow price.",
        "Structural — Perfect foresight by default: CoupledModel solves all milestone years together, so the 2030 decision already knows what 2050 needs (a lower bound on cost). RollingHorizonModel solves the years in blocks instead, each seeing only its own window; if a conclusion depends on which of the two you use, that is worth reporting.",
        "Structural — Milestone years share investment, not energy: capacity built in one year is available in later ones, but every store starts and ends each year half full and no energy is carried between milestone years — they are separate representative years, not a continuous timeline.",
        "Structural — Storage losses are per period, not per hour: exact in the normal hourly-period case, but with multi-hour periods a store would lose only one period's worth of energy over several hours.",
        "Structural — Carbon captured into an e-fuel is not tracked to its end use: CO₂ that direct air capture puts on a CO₂ bus and synthesis turns into methanol or methane leaves the model embodied in the product, so a synthetic-methane boiler is written with co2_intensity = 0 and is carbon-neutral by construction. This is the usual e-fuel convention — right only if the carbon really came from the air or a captured stream, and it would flatter a case whose CO₂ came from a fossil source. Only CO₂ sent to the sequestration sink counts as a removal.",
        "Structural — Learning is exogenous: cost declines are an input (a rate in learning_rates.csv or a € trajectory in capital_cost_by_year.csv); nothing the model builds makes the next unit cheaper. Endogenous learning would make the problem non-convex and cost the shadow prices. Transmission lines, e-fuel trade routes and e-fuel pipelines have no cost path at all — one flat cost whatever year they are built.",
        "Structural — Transmission is lossless: lines are a transfer-capacity representation (flow either way up to the corridor rating, no impedance, no losses, no loop flow), which makes the model optimistic about how much of a distant resource actually arrives. Line capacity also has no retirement and no per-vintage cost, unlike every other asset.",
        "Structural — Emission intensities are per MWh of output, not per MWh of fuel: copying a published per-fuel factor straight into co2_intensity understates a plant's emissions by its efficiency (about 15 % for an 85 %-efficient boiler). Multiply by the efficiency first.",
        "Power — A missing renewable profile means full availability: a wind or solar unit with no column in res_profile.csv, or a file missing hours, is treated as fully available — a solar farm generating at midnight. Nothing checks that the file is complete or that values lie between 0 and 1.",
        "Power — A ramp rate of zero means 'no limit', not 'cannot move': the ramp constraints are built only for a rate strictly between 0 and 1, so a case whose ramp columns are all 0 or all 1 has no thermal flexibility constraint at all.",
        "Power — The fuel column silently decides how a unit behaves: it follows its hourly profile only if fuel is wind or solar (or tech is HROR), and gets ramp constraints only if fuel is fossil or biomass (or tech contains CHP). Writing 'Offshore' instead of 'Wind' gives a farm generating at nameplate every hour, with no warning. Check that every unit's fuel uses a recognised name.",
        "Power (hydro) — A hydro scheme's capital cost is used three times (turbine plus both storage-power components), so a learning rate against capital_cost reaches only the first unless field = all is used. An e_nom_max above e_nom with no capital_cost_energy makes reservoir volume free; open-loop pumped hydro (blank e_nom_lower) assumes an infinite lower basin (the model warns); ramping_cost is read but never used.",
        "Heat — Heat units have no availability or ramp constraints: cap_factor and ramp columns exist (the file shares the power template) but the heat equations do not use them, so a boiler is available at nameplate in every hour.",
        "Heat — Distribution loss is a single constant fraction per bus: real network losses vary with load and season and are higher in summer, when flows are low relative to standing losses.",
        "Heat — CHP has no minimum load: the operating region has three edges (back-pressure line, heat cap, iso-fuel line) but no lower one, because there is no unit commitment. The efficiency column also means different things for the two CHP types (cogeneration-mode electrical for back-pressure, condensing for extraction), and nothing can detect a swap.",
        "E-fuels — A trade route is one connection used in both directions: imports and exports share the capacity and are limited together, but within an hour the split between them is unconstrained — the model does not capture the cost of reversing flow, or that a real pipeline cannot flow both ways in the same hour.",
        "E-fuels — Route losses are charged on imports, not on exports: an import arrives net of the distance loss, an export leaves at full value, so exports are worth a few per cent more than a symmetric treatment would give. Defensible (the buyer may bear the loss), but an assumption rather than a derivation.",
        "E-fuels — Retirement defaults differ in this sector: final_cap defaults to 0 here (vs 'no retirement' elsewhere), so an existing converter with blank retirement columns is fully gone at the end of its lifetime — with the 25-year default, possibly inside a 2025–2050 horizon. E-fuel stores, trade routes and links are the opposite: their existing capacity never declines.",
        "E-fuels — Storage has no power capital cost (only energy capacity is priced; charge and discharge ratings are given, not built), and pumping electricity is all charged to one default electricity bus — in a multi-zone case this puts the load in the wrong place, though the total is right.",
        "Transport — The fleet pathway is exogenous: how many vehicles of each technology exist each year is an input, not a decision. The model prices the pathway you give it but will not tell you a different pathway would be cheaper. Vehicle capital cost is computed and reported for exactly this reason, and deliberately kept out of the objective.",
        "Transport — Mobility demand is exogenous too: activity per hour is given, with no modal shift, no induced demand and no price response.",
        "Transport — One battery per fleet: a fleet is a single aggregate store, so the model can move energy between vehicles within a fleet in a way individual cars cannot (soc_min and connection keep that aggregation reasonable). Only controlled v1g/v2g fleets can leave demand unserved; a dumb or fuel fleet always meets its demand, whatever it costs.",
        "Data trap — A zero is read as a missing value in several columns: for efficiencies, availability and similar columns the loaders cannot distinguish an empty cell from a written 0, and both fall back to the default (usually 1.0). To switch a unit off, set p_nom_max = p_nom = 0 rather than writing 0 in an availability column.",
        "Data trap — Everything is a fraction: 0.9, never 90. Many columns now reject a value above 1, but not all can — a cap_factor of 0.5 is as plausible as it is wrong when 50 % was meant.",
        "Data trap — Check whether your electricity demand series already includes heat pumps and electrolysers: the model adds the consumption of heat pumps, electric boilers, e-fuel converters and vehicle charging to the electricity balance itself, so if the series already contains those loads they are counted twice — and no code can detect it.",
        "Data trap — Activity units must match between two files: transport/demand.csv gives activity per hour and fleets.csv gives activity per MWh; a vehicle-km vs thousand-vehicle-km mismatch throws the energy off by a factor of a thousand with nothing to say so.",
        "Model guardrails — Where a mistake would change the answer without being visible, the loaders raise rather than guess: e.g. a unit drawing a carrier no loaded sector produces, a fuel with no price, a mislabelled CHP type, a percentage written where a fraction is expected, an electric fleet with charging switched off, or a demand naming a bus that does not exist. Softer simplifications (an open-loop pumped-hydro scheme, a cap_factor on a unit that already has an hourly profile) trigger a warning instead of an error."
      ]
    }
  }
};
