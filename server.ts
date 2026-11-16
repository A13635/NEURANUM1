import express from 'express';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { createServer as createViteServer } from 'vite';
import { loadNpzFile, parseCsvRecords } from './lib/npzParser';
import {
  DEFAULT_SIM_CONFIG,
  runRedSimulation,
  SimulationConfig,
} from './lib/redSolver2d';
import { runMulticomponentSimulation } from './lib/multicomponentSolver2d';
import {
  runBaselineAuditCommand,
  runPitzerAndCntBenchmarks,
  runValidationSuiteLive,
  runVerificationSuiteLive,
} from './lib/verificationEngine';
import {
  buildPosterPdfBuffer,
  buildPosterPptxBuffer,
} from './lib/posterExport';

const ROOT = process.cwd();

function readJson(relPath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, relPath), 'utf-8'));
}

function readCsv(relPath: string) {
  const txt = fs.readFileSync(path.resolve(ROOT, relPath), 'utf-8');
  return parseCsvRecords(txt);
}

const FIGURE_CATALOG: Array<{
  filename: string;
  stage: string;
  title: string;
  caption: string;
}> = [
  {
    filename: 'fig01_geometry.png',
    stage: 'Baseline Geometry',
    title: 'Fig 01 — 2D RED Cell-Pair Computational Domain',
    caption:
      'Periodic cell-pair geometry (H = 270 μm, L = 10 cm) showing dilute and concentrated channels bounded by CEM and AEM interfaces.',
  },
  {
    filename: 'fig02_velocity_field.png',
    stage: 'Hydrodynamics',
    title: 'Fig 02 — Analytical Plane Poiseuille Velocity Field',
    caption:
      'Fully developed laminar parabolic velocity profile u(y) = (3/2) U_mean [4y(H-y)/H²] with zero wall slip (u = 0 at y = 0, H).',
  },
  {
    filename: 'fig03_pressure_drop.png',
    stage: 'Hydrodynamics',
    title: 'Fig 03 — Channel Pressure Drop & Pumping Power Scaling',
    caption:
      'Linear Poiseuille pressure drop Δp = 12μUL/H² vs velocity matching Gurreri et al. (2017) benchmark (146.50 Pa at 1 cm/s).',
  },
  {
    filename: 'fig04_concentration_fields.png',
    stage: 'Repaired 2D Transport',
    title: 'Fig 04 — 2D Salt Concentration & Polarization Boundary Layers',
    caption:
      'Repaired v2.0.0 concentration fields showing physical depletion at the CEM wall in the concentrated channel and enrichment in the dilute channel.',
  },
  {
    filename: 'fig05_multicomponent_ion_fields.png',
    stage: 'Stage 2: 8-Ion Brines',
    title: 'Fig 05 — 8-Ion Multicomponent Nernst-Planck Profiles',
    caption:
      'Streamwise and transverse distribution of Na+, K+, Mg2+, Ca2+, Cl-, SO4(2-), HCO3-, and CO3(2-) in real desalination brines.',
  },
  {
    filename: 'fig06_interface_concentrations.png',
    stage: 'Repaired 2D Transport',
    title: 'Fig 06 — Membrane Wall Concentration Polarization (v1 vs v2)',
    caption:
      'Comparison of CEM wall concentration profiles showing resolution of the v1.0.0 Neumann sign artifact.',
  },
  {
    filename: 'fig07_electric_potential.png',
    stage: 'Electrochemistry',
    title: 'Fig 07 — Liquid Junction Potential & Cell-Pair EMF Distribution',
    caption:
      '2D diffusion potential φ(x, y) and local Donnan-Nernst cell-pair EMF E_cell(x) along the flow channel.',
  },
  {
    filename: 'fig08_net_power_operating_conditions.png',
    stage: 'Stage 1: Clean Sobol (85 Cases)',
    title: 'Fig 08 — Net Power Density Across 85 Clean Operating Conditions',
    caption:
      'Sensitivity of P_gross, P_pump, and P_net across channel height, flow velocity, salinity gradient, temperature, and load fraction.',
  },
  {
    filename: 'fig09_mediterranean_vs_red_sea_brines.png',
    stage: 'Stage 2: 8-Ion Brines',
    title: 'Fig 09 — Mediterranean vs Red Sea & Brackish RO Brine Performance',
    caption:
      'Multicomponent ion transport power penalty relative to binary NaCl equivalent across published desalination brine compositions.',
  },
  {
    filename: 'fig10_calcite_scaling_risk_map.png',
    stage: 'Stage 3: Pitzer Thermodynamics',
    title: 'Fig 10 — Calcite (CaCO₃) Saturation Index Regime Map',
    caption:
      'Pitzer-computed wall saturation index SI_calcite across brine chemistry, pH, temperature, and concentration polarization.',
  },
  {
    filename: 'fig11_gypsum_scaling_risk_comparison.png',
    stage: 'Stage 3: Pitzer Thermodynamics',
    title: 'Fig 11 — Gypsum Saturation & Pitzer vs Davies Divergence',
    caption:
      'Demonstration of gypsum salting-in in high-salinity NaCl brines where the Davies equation over-predicts SI by >2.3 units above I > 0.5 mol/kg.',
  },
  {
    filename: 'fig12_heterogeneous_nucleation_cnt.png',
    stage: 'Stage 4: CNT Nucleation',
    title: 'Fig 12 — Heterogeneous CNT Nucleation Barrier ΔG*_het / kBT',
    caption:
      'Calcite & gypsum critical radius r*, Wenzel wetting factor f(θ_eff), and Boltzmann nucleation propensity on CEM vs AEM surfaces.',
  },
  {
    filename: 'fig13_scaling_benchmark_comparisons.png',
    stage: 'Validation Benchmarks',
    title: 'Fig 13 — Pitzer Robinson-Stokes & Santoro (2021) CNT Validation',
    caption:
      'Quantitative benchmark reproduction against Robinson & Stokes γ±(NaCl), gypsum salting-in, and Santoro et al. (2021) CNT barriers.',
  },
  {
    filename: 'fig14_performance_change_vs_clean.png',
    stage: 'Stage 4: Exploratory ΔR_m',
    title: 'Fig 14 — Exploratory Fouling Resistance Sensitivity (ΔR_m)',
    caption:
      'Parametric sensitivity of cell-pair power density under prescribed membrane resistance increments (0.2–10.0 Ω·cm²).',
  },
  {
    filename: 'fig15_mesh_convergence_and_verification.png',
    stage: 'Verification',
    title: 'Fig 15 — 3-Grid Mesh Convergence & 10-Test Verification Summary',
    caption:
      'Richardson/GCI convergence from coarse (25×10) to fine (100×40) meshes (<0.01% OCV change) and verification audit.',
  },
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Serve static PNG figures directly
  app.use(
    '/figures',
    express.static(path.resolve(ROOT, 'results/figures'), {
      maxAge: '1h',
    })
  );

  // 1. Overview endpoint
  app.get('/api/overview', (_req, res) => {
    try {
      const manifest = readJson('data/metadata/manifest.json');
      const verificationSummary = readJson(
        'results/verification/verification_summary.json'
      );
      const validationSummary = readJson(
        'results/validation/validation_summary.json'
      );
      const baselineComparison = readJson(
        'results/validation/repaired_vs_original_51.json'
      );
      const brineYaml = yaml.load(
        fs.readFileSync(path.resolve(ROOT, 'configs/brine_profiles.yaml'), 'utf-8')
      ) as Record<string, unknown>;
      const brineAudit = readCsv('data/metadata/brine_audit.csv');
      const failureLog = readCsv('data/metadata/failure_log.csv');

      res.json({
        manifest,
        verificationSummary,
        validationSummary,
        baselineComparison,
        brineProfiles: brineYaml.profiles ?? {},
        molecularWeights: brineYaml.molecular_weights_g_mol ?? {},
        brineAudit: brineAudit.rows,
        failureLog: failureLog.rows,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load overview',
      });
    }
  });

  // 2. Folder dataset explorer
  app.get('/api/datasets/folder/:folder', (req, res) => {
    try {
      const folder = req.params.folder;
      const summaryAll = readCsv('data/metadata/simulation_summary.csv');

      const getNpzIds = (dirRel: string) => {
        const dirAbs = path.resolve(ROOT, dirRel);
        if (!fs.existsSync(dirAbs)) return [];
        return fs
          .readdirSync(dirAbs)
          .filter((f) => f.endsWith('.npz'))
          .sort()
          .map((f) => f.replace(/(_fields|_wall_si)\.npz$/, ''));
      };

      if (folder === 'repaired_baseline_51') {
        const csv = readCsv('data/repaired_baseline_51/metadata/case_metadata.csv');
        const npzIds = new Set(getNpzIds('data/repaired_baseline_51/generated'));
        res.json({
          folder,
          title: 'Repaired Baseline (51 Cases — v2.0.0)',
          description:
            '51 baseline cases (case_000_reference + 50 LHS) re-solved with repaired CEM bottom-wall Neumann flux BC.',
          headers: csv.headers,
          rows: csv.rows.map((r) => ({ ...r, _hasNpz: npzIds.has(r.case_id) })),
          npzFolder: 'repaired_baseline_51',
        });
      } else if (folder === 'original_51_cases') {
        const csv = readCsv('data/original_51_cases/metadata/case_metadata.csv');
        const npzIds = new Set(getNpzIds('data/original_51_cases/generated'));
        res.json({
          folder,
          title: 'Preserved Original Baseline (51 Cases — v1.0.0)',
          description:
            'Untouched historical v1.0.0 baseline archive preserved for transparent side-by-side comparison.',
          headers: csv.headers,
          rows: csv.rows.map((r) => ({ ...r, _hasNpz: npzIds.has(r.case_id) })),
          npzFolder: 'original_51_cases',
        });
      } else if (folder === 'clean_cases') {
        const csv = readCsv('data/clean_cases/case_metadata.csv');
        const npzIds = new Set(getNpzIds('data/clean_cases/generated'));
        res.json({
          folder,
          title: 'Stage 1: Clean Operating Cases (85 Solved Sobol Runs)',
          description:
            '85 converged 2D NaCl Sobol runs across channel height, length, salinity, velocity, temperature, fixed charge, σ_m, and load fraction.',
          headers: csv.headers,
          rows: csv.rows.map((r) => ({ ...r, _hasNpz: npzIds.has(r.case_id) })),
          npzFolder: 'clean_cases',
        });
      } else if (folder === 'multicomponent_brines') {
        const csv = readCsv('data/multicomponent_brines/case_metadata.csv');
        const npzIds = new Set(getNpzIds('data/multicomponent_brines/generated'));
        res.json({
          folder,
          title: 'Stage 2: Multicomponent 8-Ion Brine Scenarios (41 Solved Runs)',
          description:
            '8-ion coupled Nernst-Planck + Donnan transport for Mediterranean, Red Sea, and Shammas desalination brines.',
          headers: csv.headers,
          rows: csv.rows.map((r) => ({ ...r, _hasNpz: npzIds.has(r.case_id) })),
          npzFolder: 'multicomponent_brines',
        });
      } else if (folder === 'scaling_risk') {
        const csv = readCsv('data/scaling_risk/case_metadata.csv');
        const npzIds = new Set(getNpzIds('data/scaling_risk/generated'));
        res.json({
          folder,
          title: 'Stage 3: Calcite & Gypsum Wall Saturation Risk (36 Cases)',
          description:
            'One-way coupled Harvie-Moller-Weare Pitzer (USGS pitzer.dat) vs Davies saturation index profiles along CEM wall.',
          headers: csv.headers,
          rows: csv.rows.map((r) => ({ ...r, _hasNpz: npzIds.has(r.case_id) })),
          npzFolder: 'scaling_risk',
        });
      } else if (folder === 'mineral_scaling') {
        const csv = readCsv('data/mineral_scaling/case_metadata.csv');
        const npzIds = new Set(getNpzIds('data/mineral_scaling/generated'));
        res.json({
          folder,
          title: 'Stage 4: CNT Nucleation (18 Cases) & Exploratory ΔR_m (8 Runs)',
          description:
            'Santoro et al. (2021) heterogeneous CNT energy barriers (Calcite & Gypsum) plus 8 explicitly labeled Exploratory ΔR_m sensitivity scenarios.',
          headers: csv.headers,
          rows: csv.rows.map((r) => ({ ...r, _hasNpz: npzIds.has(r.case_id) })),
          npzFolder: 'mineral_scaling',
        });
      } else if (folder === 'simulation_summary') {
        res.json({
          folder,
          title: 'Unified v2.0.0 Simulation Summary (188 New Cases)',
          description:
            'Master metadata table aggregating Stages 1–4 across all 188 new scenarios.',
          headers: summaryAll.headers,
          rows: summaryAll.rows.map((r) => ({ ...r, _hasNpz: false })),
          npzFolder: null,
        });
      } else if (folder === 'failure_log') {
        const csv = readCsv('data/metadata/failure_log.csv');
        res.json({
          folder,
          title: 'Convergence & Mass-Balance Failure Log (12 Excluded Runs)',
          description:
            '12 excluded Sobol/multicomponent runs documented with exact convergence and conservation residuals.',
          headers: csv.headers,
          rows: csv.rows,
          npzFolder: null,
        });
      } else if (folder === 'brine_audit') {
        const csv = readCsv('data/metadata/brine_audit.csv');
        res.json({
          folder,
          title: 'Published Desalination Brine Electroneutrality Audit (7 Brines)',
          description:
            'Raw vs charge-balanced ion concentrations, ionic strength, and inclusion flags (Santoro 2024 IC is audit-only).',
          headers: csv.headers,
          rows: csv.rows,
          npzFolder: null,
        });
      } else {
        res.status(404).json({ error: `Unknown dataset folder: ${folder}` });
      }
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load dataset folder',
      });
    }
  });

  // 3. Load specific .npz field archive
  app.get('/api/datasets/case', (req, res) => {
    try {
      const folder = String(req.query.folder ?? '');
      const caseId = String(req.query.caseId ?? '');
      const allowedFolders = new Set([
        'original_51_cases',
        'repaired_baseline_51',
        'clean_cases',
        'multicomponent_brines',
        'scaling_risk',
        'mineral_scaling',
      ]);
      if (!allowedFolders.has(folder)) {
        res.status(400).json({ error: 'Invalid folder' });
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(caseId)) {
        res.status(400).json({ error: 'Invalid caseId' });
        return;
      }

      const genDir = path.resolve(ROOT, 'data', folder, 'generated');
      const candidates = [
        path.join(genDir, `${caseId}_fields.npz`),
        path.join(genDir, `${caseId}_wall_si.npz`),
      ];
      const targetPath = candidates.find((p) => fs.existsSync(p));
      if (!targetPath) {
        res.status(404).json({ error: `NPZ file not found for ${folder}/${caseId}` });
        return;
      }

      const parsed = loadNpzFile(targetPath);
      const arrays: Record<string, { shape: number[]; data: number[] | number[][] }> = {};
      for (const [k, v] of Object.entries(parsed)) {
        arrays[k] = { shape: v.shape, data: v.data };
      }

      res.json({
        folder,
        caseId,
        filename: path.basename(targetPath),
        keys: Object.keys(arrays),
        arrays,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to decode NPZ file',
      });
    }
  });

  // 4. Benchmark cases
  app.get('/api/benchmarks', (_req, res) => {
    try {
      const files = [
        'gurreri_2017_benchmark.csv',
        'long_2018_benchmark.csv',
        'pitzer_nacl_robinson_stokes.csv',
        'pitzer_gypsum_salting_in.csv',
        'santoro_2021_calcite_cnt.csv',
      ];
      const csvBenchmarks = files.map((filename) => ({
        filename,
        ...readCsv(path.join('data/benchmark_cases', filename)),
      }));
      const mujahidNotes = readJson(
        'data/benchmark_cases/mujahid_2026_gypsum_silica_notes.json'
      );
      res.json({ csvBenchmarks, mujahidNotes });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load benchmarks',
      });
    }
  });

  // 5. Figures list
  app.get('/api/figures', (_req, res) => {
    const dir = path.resolve(ROOT, 'results/figures');
    const existing = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
    res.json({
      figures: FIGURE_CATALOG.filter((f) => existing.has(f.filename)).map((f) => ({
        ...f,
        url: `/figures/${f.filename}`,
      })),
    });
  });

  // 6. Materials catalog (reports, configs, src, tests, scripts)
  app.get('/api/materials', (_req, res) => {
    try {
      const listDir = (relDir: string) => {
        const abs = path.resolve(ROOT, relDir);
        if (!fs.existsSync(abs)) return [];
        return fs
          .readdirSync(abs)
          .filter((f) => !f.startsWith('__') && !f.startsWith('.'))
          .sort()
          .map((f) => `${relDir}/${f}`);
      };

      const provenance = readCsv('reports/parameter_provenance.csv');

      res.json({
        groups: [
          {
            id: 'reports',
            title: 'Technical Reports & Documentation',
            files: [
              'README.md',
              ...listDir('reports').filter((f) => f.endsWith('.md')),
              'TECHNICAL_REPORT.md',
              'LITERATURE_REVIEW.md',
              'MODEL_SPECIFICATION.md',
            ].filter((f, idx, arr) => arr.indexOf(f) === idx && fs.existsSync(path.resolve(ROOT, f))),
          },
          {
            id: 'configs',
            title: 'Simulation & Pitzer Configurations',
            files: listDir('configs'),
          },
          {
            id: 'src',
            title: 'Python Physics & Thermodynamic Modules (src/)',
            files: listDir('src'),
          },
          {
            id: 'tests',
            title: 'Pytest Verification & Geochemistry Suite (tests/)',
            files: listDir('tests'),
          },
          {
            id: 'scripts',
            title: 'CLI Pipeline & Verification Scripts (scripts/)',
            files: listDir('scripts'),
          },
        ],
        parameterProvenance: provenance,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to list materials',
      });
    }
  });

  // 7. Read specific material file safely
  app.get('/api/materials/file', (req, res) => {
    try {
      const rel = String(req.query.path ?? '');
      const normalized = path.posix.normalize(rel).replace(/^\/+/, '');
      const allowedRoots = [
        'README.md',
        'TECHNICAL_REPORT.md',
        'LITERATURE_REVIEW.md',
        'MODEL_SPECIFICATION.md',
        'PARAMETER_PROVENANCE.csv',
        'reports/',
        'configs/',
        'src/',
        'tests/',
        'scripts/',
      ];
      const isAllowed = allowedRoots.some(
        (prefix) => normalized === prefix || normalized.startsWith(prefix)
      );
      if (!isAllowed || normalized.includes('..')) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      const abs = path.resolve(ROOT, normalized);
      if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      const content = fs.readFileSync(abs, 'utf-8');
      res.json({
        path: normalized,
        ext: path.extname(normalized).toLowerCase(),
        content,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to read file',
      });
    }
  });

  // 8. Live 2D Simulation API
  app.post('/api/simulate', (req, res) => {
    try {
      const body = req.body ?? {};
      const partial: Partial<SimulationConfig> = {};

      const numericFields: Array<keyof SimulationConfig> = [
        'channelHeight',
        'channelLength',
        'membraneThicknessCem',
        'membraneThicknessAem',
        'nx',
        'ny',
        'uMeanConc',
        'uMeanDil',
        'cConcInlet',
        'cDilInlet',
        'T',
        'xCem',
        'xAem',
        'sigmaCem',
        'sigmaAem',
        'loadFraction',
        'deltaRmOhmCm2',
        'pH',
        'caInletMolM3',
        'mgInletMolM3',
        'kInletMolM3',
        'so4InletMolM3',
        'hco3InletMolM3',
        'co3InletMolM3',
        'contactAngleCemDeg',
        'roughnessFactorCem',
      ];
      for (const k of numericFields) {
        if (typeof body[k] === 'number' && Number.isFinite(body[k])) {
          (partial as Record<string, unknown>)[k] = body[k];
        }
      }
      if (body.bcMode === 'v1_buggy_cem' || body.bcMode === 'v2_repaired') {
        partial.bcMode = body.bcMode;
      }
      if (typeof body.caseId === 'string') {
        partial.caseId = body.caseId;
      }

      const solverMode =
        body.solverMode === 'multicomponent' ? 'multicomponent' : 'binary';

      if (solverMode === 'multicomponent') {
        partial.nx = Math.max(25, Math.min(55, Math.round(body.nx ?? 45)));
        partial.ny = Math.max(12, Math.min(22, Math.round(body.ny ?? 18)));
        const mcResult = runMulticomponentSimulation(partial);

        let binaryComparison = null;
        if (body.compareWithBinary !== false) {
          const cEq =
            (partial.cConcInlet ?? DEFAULT_SIM_CONFIG.cConcInlet) +
            (partial.kInletMolM3 ?? DEFAULT_SIM_CONFIG.kInletMolM3) +
            2 * (partial.mgInletMolM3 ?? DEFAULT_SIM_CONFIG.mgInletMolM3) +
            2 * (partial.caInletMolM3 ?? DEFAULT_SIM_CONFIG.caInletMolM3);
          binaryComparison = runRedSimulation({
            ...partial,
            bcMode: 'v2_repaired',
            cConcInlet: cEq,
            caseId: `${partial.caseId ?? 'sim'}_eq_binary`,
          });
        }
        res.json({
          result: mcResult,
          v1Comparison: null,
          binaryComparison,
        });
        return;
      }

      // Clamp grid resolution to safe interactive bounds
      partial.nx = Math.max(
        20,
        Math.min(80, Math.round(partial.nx ?? DEFAULT_SIM_CONFIG.nx))
      );
      partial.ny = Math.max(
        10,
        Math.min(35, Math.round(partial.ny ?? DEFAULT_SIM_CONFIG.ny))
      );

      const result = runRedSimulation(partial);
      let v1Comparison = null;
      if (body.compareWithV1 === true) {
        v1Comparison = runRedSimulation({
          ...partial,
          bcMode: 'v1_buggy_cem',
          caseId: `${partial.caseId ?? 'sim'}_v1_buggy`,
        });
      }

      res.json({ result, v1Comparison, binaryComparison: null });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Simulation failed',
      });
    }
  });

  // 9. Executable Verification & Validation Commands
  app.post('/api/commands/run', (req, res) => {
    try {
      const commandId = String(req.body?.commandId ?? 'verification_suite');
      if (commandId === 'verification_suite') {
        res.json(runVerificationSuiteLive());
      } else if (commandId === 'validation_suite') {
        res.json(runValidationSuiteLive());
      } else if (commandId === 'pitzer_benchmarks') {
        res.json(runPitzerAndCntBenchmarks());
      } else if (commandId === 'baseline_audit') {
        res.json(runBaselineAuditCommand());
      } else {
        res.status(400).json({ error: `Unknown commandId: ${commandId}` });
      }
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Command execution failed',
      });
    }
  });

  // 10. Downloadable ISEF Display Board (.pptx and .pdf)
  app.get('/api/poster/download/pptx', async (req, res) => {
    try {
      const buf = await buildPosterPptxBuffer({
        projectCode: String(req.query.projectCode ?? ''),
        teamMembers: String(req.query.teamMembers ?? ''),
        schoolName: String(req.query.schoolName ?? ''),
      });
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="NEURANUM_ISEF_Poster_48x36.pptx"'
      );
      res.send(buf);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'PPTX export failed',
      });
    }
  });

  app.get('/api/poster/download/pdf', async (req, res) => {
    try {
      const buf = await buildPosterPdfBuffer({
        projectCode: String(req.query.projectCode ?? ''),
        teamMembers: String(req.query.teamMembers ?? ''),
        schoolName: String(req.query.schoolName ?? ''),
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="NEURANUM_ISEF_Poster_48x36.pdf"'
      );
      res.send(buf);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'PDF export failed',
      });
    }
  });

  // Vite / Static SPA serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('NEURANUM v2.0.0 Full-Stack Server listening on http://0.0.0.0:3000');
  });
}

startServer();
