export interface PosterCustomMeta {
  projectCode: string;
  teamMembers: string;
  schoolName: string;
}

export const DEFAULT_POSTER_META: PosterCustomMeta = {
  projectCode: 'ENG-RED-2027',
  teamMembers: 'NEURANUM Research Team',
  schoolName: 'STEM Engineering Research Lab',
};

export interface PosterFigureSpec {
  id: string;
  filename: string;
  title: string;
  axesAndUnits: string;
  caption: string;
}

export const POSTER_FIGURES: PosterFigureSpec[] = [
  {
    id: 'Fig. 1',
    filename: 'fig04_concentration_fields.png',
    title: 'Fig. 1 — 2D Salinity & CEM Boundary-Layer Polarization',
    axesAndUnits: 'x (m), y (μm), Concentration c (mol/m³)',
    caption:
      'Repaired v2.0.0 Neumann flux resolves HC wall depletion and LC enrichment across the membrane interface.',
  },
  {
    id: 'Fig. 2',
    filename: 'fig09_mediterranean_vs_red_sea_brines.png',
    title: 'Fig. 2 — 8-Ion RO Brine Power vs. Equivalent NaCl',
    axesAndUnits: 'Brine Profile, Gross & Net Power Density (W/m²)',
    caption:
      'Divalent competition (Ca²⁺, Mg²⁺, SO₄²⁻) significantly reduces power in Mediterranean and Red Sea RO brines.',
  },
  {
    id: 'Fig. 3',
    filename: 'fig11_gypsum_scaling_risk_comparison.png',
    title: 'Fig. 3 — Gypsum Saturation: USGS Pitzer vs. Davies Breakdown',
    axesAndUnits: 'Ionic Strength I (mol/kg), Saturation Index SI (-)',
    caption:
      'Above I > 0.5 mol/kg, Davies over-predicts scaling risk by >2.3 SI units, while HMW Pitzer captures salting-in.',
  },
  {
    id: 'Fig. 4',
    filename: 'fig10_calcite_scaling_risk_map.png',
    title: 'Fig. 4 — CEM Wall Calcite Saturation Index (SI_Pitzer) Map',
    axesAndUnits: 'Operating Regime / I (mol/kg), SI_calcite (-)',
    caption:
      'Thermodynamic CaCO₃ supersaturation zones (SI > 0) along the cation-exchange membrane interface.',
  },
];

export const POSTER_DATA = {
  title:
    'NEURANUM: Physics-Based 2D Simulation and Predictive Modeling of Membrane Scaling Risk in Desalination Brine Reverse Electrodialysis',
  subtitle:
    'Multi-Physics Ion Transport, USGS Pitzer Geochemistry, and Surrogate PINN Feasibility for Real-Time Control',

  abstract:
    'Reverse osmosis (RO) desalination consumes intensive energy while discharging hypersaline brine, wasting chemical mixing energy and altering coastal salinity. Reverse Electrodialysis (RED) recovers electrical power across ion-exchange membranes, yet divalent cations (Ca²⁺, Mg²⁺) and concentration polarization cause inorganic mineral scaling (CaCO₃, CaSO₄·2H₂O) that degrades permselectivity and raises resistance. NEURANUM v2.0.0 is a verified 2D finite-volume RED simulator combining Poiseuille flow, Donnan partitioning, and 8-ion Nernst–Planck–GHK transport coupled to USGS HMW Pitzer thermodynamics and Santoro (2021) Classical Nucleation Theory. After correcting a CEM boundary-flux sign error, all 10 verification checks pass (<0.01% mesh sensitivity), matching Gurreri et al. (2017) within 0.13% OCV and 0.001% Δp across 188 curated cases. Preliminary binary PINN testing identified steep potential-gradient and charge-balance errors on uniform grids, guiding ongoing physics-loss refinement for real-time scaling control.',

  generalProblem:
    'Desalination plants require high electrical power and discharge concentrated RO brine (57–80 g/L TDS), wasting extractable salinity-gradient mixing energy and elevating local marine salinity.',

  specializedProblem:
    'In RED brine recovery, Ca²⁺, Mg²⁺, SO₄²⁻, and carbonate polarization trigger mineral scaling on CEM walls, degrading power output—while full 2D PDE+Pitzer solvers are too slow for real-time stack control.',

  sorourBrineTable: {
    caption: 'Published Egyptian RO Brines (Sorour et al., 2015)',
    headers: ['Constituent', 'Med. Brine B1', 'Red Sea B2'],
    rows: [
      ['TDS', '62.64 g/L', '73.87 g/L'],
      ['Na⁺ / Cl⁻', '19.0 / 35.0 g/L', '24.0 / 40.0 g/L'],
      ['Mg²⁺ / Ca²⁺', '1.92 / 0.80 g/L', '2.60 / 0.69 g/L'],
    ],
  },

  backgroundTable: {
    headers: ['Study', 'Contribution', 'Role in NEURANUM'],
    rows: [
      ['Gurreri (2017)', '2D multiphysics RED cell CFD', 'Baseline PDEs & OCV benchmark'],
      ['Tedesco (2016)', 'Co-ion leakage & fixed charge', 'Donnan & divalent retardation'],
      ['Long (2018)', '1D stack pump-loss model', 'R_int, P_pump vs P_net optimization'],
      ['Faghihi (2022)', '2D CFD + ANN optimization', 'Benchmark prior AI in binary RED'],
      ['Santoro (2021)', 'Calcite CNT nucleation in RED', 'Wenzel barrier ΔG*_het / k_B T'],
      ['PHREEQC (2013)', 'USGS Pitzer virial database', 'High-I SI_calcite & SI_gypsum'],
    ],
  },

  researchGap:
    'Prior AI-RED studies (Faghihi & Jalali, 2022) used binary NaCl only. No open 2D dataset couples 8-ion Nernst–Planck transport with high-I USGS Pitzer scaling to train and audit real-time PINNs.',

  researchQuestion:
    'Can a Physics-Informed Neural Network (PINN) predict membrane mineral scaling risk in desalination brine reverse electrodialysis (RED) for real-time operational control?',

  hypothesis:
    'A PDE-constrained PINN can approximate 2D multicomponent transport and Pitzer scaling-risk fields for real-time operational control once interfacial boundary-layer gradients and electroneutrality are strictly enforced.',

  materialsTools: [
    ['Python / NumPy / SciPy', '2D FVM PDEs, SuperLU & USGS Pitzer engine'],
    ['PyTorch', 'PINN surrogate prototyping & PDE/BC residual loss'],
    ['pyDOE2 / Sobol / Pandas', 'LHS & Sobol DOE sampling, CSV ledgers'],
    ['Matplotlib / pytest / Web', '300-DPI figures, 10-test suite & live 2D app'],
  ],

  variablesTable: {
    headers: ['Type', 'Parameters (case_metadata.csv Schema)'],
    rows: [
      [
        'Independent (7)',
        'c_conc_inlet_mol_m3, c_dil_inlet_mol_m3, u_mean_conc_m_s, u_mean_dil_m_s, channel_height_um, temperature_K, X_cem_mol_m3',
      ],
      [
        'Dependent',
        'u(y), p(x), c_k(x,y) [8 ions], Φ(x,y), OCV, R_internal, P_gross, P_net, Δp, SI_Pitzer, ΔG*_het/k_BT',
      ],
      [
        'Controlled',
        'L = 0.10 m, δ_m = 125 μm, σ_m = 1.0 S/m, η_pump = 0.75, laminar no-slip, v_y = 0',
      ],
    ],
  },

  procedureSteps: [
    '1. Literature & Brine Audit: Extract governing equations, 42 constants, and 6 complete Egyptian RO brines.',
    '2. 2D Solver & Repair: Build Poiseuille + Scharfetter–Gummel NP + Donnan–GHK solver; fix CEM flux sign.',
    '3. Geochemical Coupling: Couple wall fields to USGS HMW Pitzer SI and Santoro (2021) CNT barriers.',
    '4. Curated Dataset: Solve 51 baseline + 85 clean Sobol + 41 8-ion + 36 Pitzer + 26 CNT/ΔR_m runs.',
    '5. Initial PINN Training: Train a PyTorch PINN prototype on early 51-case binary fields.',
    '6. Verification & Audit: Run 10 solver tests, literature benchmarks, and out-of-sample PINN error checks.',
    '7. Model Refinement: Target boundary-layer collocation and charge constraints for v2.0.0 retraining.',
  ],

  verifiedDataTable: {
    headers: ['Verification / Benchmark', 'Reference Target', 'NEURANUM v2.0.0', 'Status'],
    rows: [
      ['Gurreri (2017) Baseline OCV', '155.00 mV', '155.21 mV', '+0.13% · PASS'],
      ['Channel Pressure Drop Δp', '146.50 Pa', '146.502 Pa', '+0.001% · PASS'],
      ['Peak Gross Power P_gross', '3.80 W/m²', '3.901 W/m²', '+2.67% · PASS'],
      ['Dilute Mass Balance (v1→v2)', '3.40% (v1)', '0.10% (v2)', '33× Better · PASS'],
      ['3-Grid OCV Mesh Convergence', '< 2.0% target', '0.003%', '10/10 Suite · PASS'],
      ['El-Remel 8-Ion Brine OCV', 'Stage 2 Brine', '201.12 mV (SI=+0.91)', 'CBE < 1e-15 · PASS'],
    ],
  },

  dataAnalysisPoints: [
    '• Flow–Power Trade-Off: Higher flow reduces concentration polarization resistance, but quadratic pumping loss (P_pump ∝ ū²) creates a narrow net-power optimum.',
    '• 8-Ion Brine Penalty: Divalent Ca²⁺/Mg²⁺ Donnan competition and lower membrane mobility cut gross power vs. equivalent-salinity NaCl feeds.',
    '• Pitzer vs. Davies: High-TDS RO brines (I = 0.77–1.66 mol/kg) exceed the I = 0.5 Davies limit; only Pitzer correctly predicts gypsum salting-in.',
    '• Surrogate Sensitivity: Sharp 10–20 μm CEM boundary layers and potential gradients (Φ) dominate neural surrogate error under uniform sampling.',
  ],

  resultsSummary: [
    '10/10 Physics & Verification Pass: Analytical Poiseuille flow, mass conservation (<0.1%), Donnan flux continuity, zero-gradient limits, and machine-precision electroneutrality (~10⁻¹⁶) verified.',
    '188 New + 51 Baseline Runs Solved: Real Mediterranean & Red Sea RO concentrates consistently reach CEM calcite supersaturation (SI = +0.67 to +1.03), identifying concrete scaling-risk envelopes.',
  ],

  pinnSummaryTable: {
    headers: ['Prototype Field Metric', 'Observed Gap', 'Engineering Diagnosis'],
    rows: [
      ['Velocity / Pressure L2', '31.5% / 37.2%', 'Requires analytical Poiseuille hard-BC'],
      ['Na⁺ / Cl⁻ Concentration L2', '29.3% / 25.1%', 'Needs boundary-layer collocation near y = 0'],
      ['Electric Potential Φ L2', '78.5%', 'Requires normalized potential-loss scaling'],
      ['Electroneutrality / P_net', '12.99% / 42.2%', 'Enforce hard ∑z_k c_k = 0; retrain on v2.0'],
    ],
    note: 'Calcite SI denotes thermodynamic supersaturation only, not time-dependent fouling thickness. Retraining on NEURANUM v2.0.0 is required before operational control use.',
  },

  conclusions: [
    'NEURANUM v2.0.0 establishes a verified 2D multicomponent RED simulator and 188-case + 51-baseline dataset showing that velocity-polarization trade-offs, divalent ion losses, and high-I Pitzer thermodynamics govern power and scaling risk.',
    'Addressing the hypothesis, initial binary PINN testing quantified baseline accuracy gaps in electric potential (Φ) and electroneutrality on uniform grids, identifying the exact boundary-layer collocation and hard charge constraints required for real-time control.',
  ],

  applications: [
    'Pre-pilot assessment of salinity-gradient energy recovery for Mediterranean and Red Sea RO reject brines.',
    'Identifying scaling-safe pH, velocity, and recovery windows prior to membrane fouling damage.',
  ],

  futureWork: [
    '1. Retrain PINN on v2.0.0 8-ion + Pitzer fields with boundary-layer collocation and hard electroneutrality.',
    '2. Predict wall SI_calcite, SI_gypsum, and CNT nucleation propensity in real time from feed sensors.',
    '3. Incorporate experimentally calibrated precipitation kinetics and compare RED against PRO recovery.',
  ],

  apaReferences: [
    'Abdel-Aal, E. A., et al. (2021). Brine characterization from Mediterranean & brackish RO plants. Membranes, 11(3), 212.',
    'Faghihi, P., & Jalali, A. (2022). ANN optimization of RED cells using CFD and genetic algorithm. Int. J. Energy Res., 46(15), 21217–21233.',
    'Gurreri, L., et al. (2017). Multi-physical modelling of reverse electrodialysis. Desalination, 423, 52–64.',
    'Harvie, C. E., Møller, N., & Weare, J. H. (1984). Mineral solubilities to high ionic strengths. Geochim. Cosmochim. Acta, 48(4), 723–751.',
    'Long, R., et al. (2018). Performance analysis of RED stacks: Geometry and flow optimization. Energy, 158, 427–436.',
    'Parkhurst, D. L., & Appelo, C. A. J. (2013). PHREEQC version 3 (pitzer.dat). USGS Techniques and Methods 6-A43.',
    'Santoro, S., et al. (2021). Fouling propensity in RED operated with hypersaline brine. Energy, 228, 120563.',
    'Sorour, M. H., et al. (2015). Salt recovery from seawater and RO brines. Desalin. Water Treat., 55(9), 2398–2407.',
    'Tedesco, M., Hamelers, H. V. M., & Biesheuvel, P. M. (2016). Nernst–Planck transport theory for RED. J. Membr. Sci., 510, 370–381.',
    'Vermaas, D. A., et al. (2013). Fouling in reverse electrodialysis under natural conditions. Water Research, 47(3), 1289–1298.',
  ],
};
